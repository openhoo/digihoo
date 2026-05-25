import { describe, expect, it, vi } from "vitest";
import { DigiKeyAuthClient, DigiKeyApiError, DigiKeyNetworkError, DigiKeyRefreshTokenProvider } from "../src";
import type { FetchLike } from "../src";

describe("DigiKeyAuthClient", () => {
  it("builds Digi-Key authorization URLs", () => {
    const auth = new DigiKeyAuthClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      environment: "sandbox"
    });

    const url = new URL(
      auth.buildAuthorizationUrl({
        redirectUri: "https://example.com/callback",
        state: "csrf"
      })
    );

    expect(url.origin).toBe("https://sandbox-api.digikey.com");
    expect(url.pathname).toBe("/v1/oauth2/authorize");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("https://example.com/callback");
    expect(url.searchParams.get("state")).toBe("csrf");
  });

  it("requests and caches client credentials tokens", async () => {
    const fetch = vi.fn<FetchLike>(async () =>
      jsonResponse({
        access_token: "access-token",
        token_type: "Bearer",
        expires_in: 3600
      })
    );

    const auth = new DigiKeyAuthClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      environment: "sandbox",
      fetch
    });

    await expect(auth.getAccessToken()).resolves.toBe("access-token");
    await expect(auth.getAccessToken()).resolves.toBe("access-token");

    expect(fetch).toHaveBeenCalledTimes(1);
    const [input, init] = fetch.mock.calls[0]!;
    expect(String(input)).toBe("https://sandbox-api.digikey.com/v1/oauth2/token");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/x-www-form-urlencoded");
    expect(String(init?.body)).toBe(
      "grant_type=client_credentials&client_id=client-id&client_secret=client-secret"
    );
  });

  it("coalesces concurrent client credentials token requests", async () => {
    let resolveResponse!: (response: Response) => void;
    const fetch = vi.fn<FetchLike>(
      () =>
        new Promise((resolve) => {
          resolveResponse = resolve;
        })
    );
    const auth = new DigiKeyAuthClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      fetch
    });

    const first = auth.getAccessToken();
    const second = auth.getAccessToken();
    expect(fetch).toHaveBeenCalledTimes(1);

    resolveResponse(
      jsonResponse({
        access_token: "access-token",
        expires_in: 3600
      })
    );

    await expect(Promise.all([first, second])).resolves.toEqual(["access-token", "access-token"]);
    await expect(auth.getAccessToken()).resolves.toBe("access-token");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not coalesce client credentials token requests with request-specific timeout", async () => {
    vi.useFakeTimers();
    try {
      const fetch = vi.fn<FetchLike>(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
          })
      );
      const auth = new DigiKeyAuthClient({
        clientId: "client-id",
        clientSecret: "client-secret",
        fetch
      });

      const first = auth.getAccessToken({ timeoutMs: 10 });
      const second = auth.getAccessToken({ timeoutMs: 20 });
      expect(fetch).toHaveBeenCalledTimes(2);

      const firstAssertion = expect(first).rejects.toMatchObject({
        name: "DigiKeyNetworkError",
        message: "Digi-Key request timed out after 10ms.",
        isTimeout: true
      } satisfies Partial<DigiKeyNetworkError>);
      const secondAssertion = expect(second).rejects.toMatchObject({
        name: "DigiKeyNetworkError",
        message: "Digi-Key request timed out after 20ms.",
        isTimeout: true
      } satisfies Partial<DigiKeyNetworkError>);

      await vi.advanceTimersByTimeAsync(10);
      await firstAssertion;
      await vi.advanceTimersByTimeAsync(10);
      await secondAssertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it("exchanges authorization codes", async () => {
    const fetch = vi.fn<FetchLike>(async () =>
      jsonResponse({
        access_token: "access-token",
        refresh_token: "refresh-token",
        expires_in: 900
      })
    );
    const auth = new DigiKeyAuthClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      fetch
    });

    await auth.exchangeAuthorizationCode({
      code: "code",
      redirectUri: "https://example.com/callback"
    });

    const [, init] = fetch.mock.calls[0]!;
    expect(String(init?.body)).toBe(
      "grant_type=authorization_code&client_id=client-id&client_secret=client-secret&code=code&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback"
    );
  });

  it("throws DigiKeyApiError for token endpoint failures", async () => {
    const fetch = vi.fn<FetchLike>(async () =>
      jsonResponse(
        {
          ErrorMessage: "invalid_client",
          RequestId: "request-id"
        },
        401,
        "Unauthorized"
      )
    );
    const auth = new DigiKeyAuthClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      fetch
    });

    await expect(auth.getAccessToken()).rejects.toMatchObject({
      name: "DigiKeyApiError",
      status: 401,
      requestId: "request-id"
    } satisfies Partial<DigiKeyApiError>);
  });

  it("wraps token transport failures in DigiKeyNetworkError", async () => {
    const fetch = vi.fn<FetchLike>(async () => {
      throw new TypeError("socket closed");
    });
    const auth = new DigiKeyAuthClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      fetch
    });

    await expect(auth.getAccessToken()).rejects.toMatchObject({
      name: "DigiKeyNetworkError",
      message: "Digi-Key request failed before receiving a response: socket closed",
      method: "POST",
      isTimeout: false,
      isAbort: false
    } satisfies Partial<DigiKeyNetworkError>);
  });


  it("refreshes access tokens and keeps the latest rotated refresh token", async () => {
    const onToken = vi.fn();
    const fetch = vi
      .fn<FetchLike>()
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "access-token-1",
          refresh_token: "refresh-token-2",
          expires_in: 1
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "access-token-2",
          refresh_token: "refresh-token-3",
          expires_in: 1
        })
      );
    const auth = new DigiKeyAuthClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      fetch
    });
    const provider = new DigiKeyRefreshTokenProvider({
      authClient: auth,
      refreshToken: "refresh-token-1",
      clockSkewMs: 60_000,
      onToken
    });

    await expect(provider.getAccessToken()).resolves.toBe("access-token-1");
    await expect(provider.getAccessToken()).resolves.toBe("access-token-2");

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(String(fetch.mock.calls[0]?.[1]?.body)).toContain("refresh_token=refresh-token-1");
    expect(String(fetch.mock.calls[1]?.[1]?.body)).toContain("refresh_token=refresh-token-2");
    expect(onToken).toHaveBeenCalledTimes(2);
  });

  it("coalesces concurrent refresh-token requests to protect rotated refresh tokens", async () => {
    let resolveResponse!: (response: Response) => void;
    const onToken = vi.fn();
    const fetch = vi.fn<FetchLike>(
      () =>
        new Promise((resolve) => {
          resolveResponse = resolve;
        })
    );
    const auth = new DigiKeyAuthClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      fetch
    });
    const provider = new DigiKeyRefreshTokenProvider({
      authClient: auth,
      refreshToken: "refresh-token-1",
      onToken
    });

    const first = provider.getAccessToken();
    const second = provider.getAccessToken();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(fetch.mock.calls[0]?.[1]?.body)).toContain("refresh_token=refresh-token-1");

    resolveResponse(
      jsonResponse({
        access_token: "access-token",
        refresh_token: "refresh-token-2",
        expires_in: 3600
      })
    );

    await expect(Promise.all([first, second])).resolves.toEqual(["access-token", "access-token"]);
    await expect(provider.getAccessToken()).resolves.toBe("access-token");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(onToken).toHaveBeenCalledTimes(1);
  });

  it("uses unexpired initial refresh-provider tokens without refreshing", async () => {
    const fetch = vi.fn<FetchLike>(async () => {
      throw new Error("unexpected refresh");
    });
    const auth = new DigiKeyAuthClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      fetch
    });
    const providerFromExpiresAt = new DigiKeyRefreshTokenProvider({
      authClient: auth,
      refreshToken: "refresh-token",
      accessToken: "cached-token",
      expiresAt: Date.now() + 60_000
    });
    const providerFromExpiresIn = new DigiKeyRefreshTokenProvider({
      authClient: auth,
      refreshToken: "refresh-token",
      accessToken: "cached-token-from-expires-in",
      expiresIn: 60
    });
    const providerFromDate = new DigiKeyRefreshTokenProvider({
      authClient: auth,
      refreshToken: "refresh-token",
      accessToken: "cached-token-from-date",
      expiresAt: new Date(Date.now() + 60_000)
    });

    await expect(providerFromExpiresAt.getAccessToken()).resolves.toBe("cached-token");
    await expect(providerFromExpiresIn.getAccessToken()).resolves.toBe("cached-token-from-expires-in");
    await expect(providerFromDate.getAccessToken()).resolves.toBe("cached-token-from-date");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fails only the pre-aborted refresh-token caller while the shared refresh continues", async () => {
    let resolveResponse!: (response: Response) => void;
    const fetch = vi.fn<FetchLike>(
      () =>
        new Promise((resolve) => {
          resolveResponse = resolve;
        })
    );
    const auth = new DigiKeyAuthClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      fetch
    });
    const provider = new DigiKeyRefreshTokenProvider({
      authClient: auth,
      refreshToken: "refresh-token"
    });
    const controller = new AbortController();
    controller.abort(new DOMException("caller aborted", "AbortError"));

    await expect(provider.getAccessToken({ signal: controller.signal })).rejects.toMatchObject({
      name: "DigiKeyNetworkError",
      isAbort: true
    } satisfies Partial<DigiKeyNetworkError>);
    expect(fetch).toHaveBeenCalledTimes(1);

    resolveResponse(
      jsonResponse({
        access_token: "access-token",
        expires_in: 3600
      })
    );
    await expect(provider.getAccessToken()).resolves.toBe("access-token");
  });

  it("aborts token requests after the configured timeout", async () => {
    vi.useFakeTimers();
    try {
      const fetch = vi.fn<FetchLike>(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
          })
      );
      const auth = new DigiKeyAuthClient({
        clientId: "client-id",
        clientSecret: "client-secret",
        fetch
      });

      const request = auth.getClientCredentialsToken({ timeoutMs: 25 });
      const assertion = expect(request).rejects.toMatchObject({
        name: "DigiKeyNetworkError",
        message: "Digi-Key request timed out after 25ms.",
        isTimeout: true,
        method: "POST"
      } satisfies Partial<DigiKeyNetworkError>);

      await vi.advanceTimersByTimeAsync(25);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it("lets refresh-token callers time out without aborting the shared refresh", async () => {
    vi.useFakeTimers();
    try {
      let resolveResponse!: (response: Response) => void;
      const fetch = vi.fn<FetchLike>(
        () =>
          new Promise((resolve) => {
            resolveResponse = resolve;
          })
      );
      const auth = new DigiKeyAuthClient({
        clientId: "client-id",
        clientSecret: "client-secret",
        fetch
      });
      const provider = new DigiKeyRefreshTokenProvider({
        authClient: auth,
        refreshToken: "refresh-token"
      });

      const request = provider.getAccessToken({ timeoutMs: 35 });
      const assertion = expect(request).rejects.toMatchObject({
        name: "DigiKeyNetworkError",
        message: "Digi-Key request timed out after 35ms.",
        isTimeout: true
      } satisfies Partial<DigiKeyNetworkError>);

      await vi.advanceTimersByTimeAsync(35);
      await assertion;
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(String(fetch.mock.calls[0]?.[1]?.body)).toContain("grant_type=refresh_token");

      resolveResponse(
        jsonResponse({
          access_token: "access-token",
          refresh_token: "refresh-token-2",
          expires_in: 3600
        })
      );

      await expect(provider.getAccessToken()).resolves.toBe("access-token");
      expect(fetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects malformed empty and non-JSON token responses", async () => {
    const fetch = vi
      .fn<FetchLike>()
      .mockResolvedValueOnce(new Response(null, { status: 200, statusText: "OK" }))
      .mockResolvedValueOnce(
        new Response("not-json", {
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "text/plain"
          }
        })
      );
    const auth = new DigiKeyAuthClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      fetch
    });

    await expect(auth.getClientCredentialsToken()).rejects.toThrow(
      "Digi-Key OAuth response did not include an access_token."
    );
    await expect(auth.getClientCredentialsToken()).rejects.toThrow(
      "Digi-Key OAuth response did not include an access_token."
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("requires an explicit fetch implementation when global fetch is unavailable", () => {
    vi.stubGlobal("fetch", undefined);
    try {
      expect(
        () =>
          new DigiKeyAuthClient({
            clientId: "client-id",
            clientSecret: "client-secret"
          })
      ).toThrow("A fetch implementation is required in this runtime.");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

function jsonResponse(body: unknown, status = 200, statusText = "OK"): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
