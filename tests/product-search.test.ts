import { describe, expect, it, vi } from "vitest";
import { DigiKeyApiError, DigiKeyAuthClient, DigiKeyClient, DigiKeyConfigurationError, DigiKeyNetworkError, DigiKeyRefreshTokenProvider } from "../src";
import type {
  FetchLike,
  ManufacturersOptions,
  MediaOptions,
  ProductChangeNotificationsOptions,
  ProductPricingOptions,
  TokenProvider
} from "../src";

describe("ProductSearchClient", () => {
  it("sends product details requests with OAuth, client id, locale, account id, and query parameters", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({ DigiKeyProductNumber: "296-6501-1-ND" }));
    const client = testClient(fetch);

    await client.productSearch.productDetails("296-6501-1-ND", {
      manufacturerId: "123",
      includes: "Parameters",
      headers: {
        "X-Test": "value"
      }
    });

    const [input, init] = fetch.mock.calls[0]!;
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);

    expect(url.origin).toBe("https://sandbox-api.digikey.com");
    expect(url.pathname).toBe("/products/v4/search/296-6501-1-ND/productdetails");
    expect(url.searchParams.get("manufacturerId")).toBe("123");
    expect(url.searchParams.get("includes")).toBe("Parameters");
    expect(headers.get("Authorization")).toBe("Bearer access-token");
    expect(headers.get("X-DIGIKEY-Client-Id")).toBe("client-id");
    expect(headers.get("X-DIGIKEY-Locale-Site")).toBe("US");
    expect(headers.get("X-DIGIKEY-Locale-Language")).toBe("en");
    expect(headers.get("X-DIGIKEY-Locale-Currency")).toBe("USD");
    expect(headers.get("X-DIGIKEY-Account-Id")).toBe("account-id");
    expect(headers.get("X-Test")).toBe("value");
  });

  it("posts keyword search bodies as JSON", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({ ProductsCount: 0 }));
    const client = testClient(fetch);

    await client.productSearch.keywordSearch(
      {
        Keywords: "microcontroller",
        Limit: 10
      },
      {
        includes: "Products(DigiKeyProductNumber)"
      }
    );

    const [input, init] = fetch.mock.calls[0]!;
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);

    expect(init?.method).toBe("POST");
    expect(url.pathname).toBe("/products/v4/search/keyword");
    expect(url.searchParams.get("includes")).toBe("Products(DigiKeyProductNumber)");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init?.body).toBe(JSON.stringify({ Keywords: "microcontroller", Limit: 10 }));
    expect(headers.has("X-DIGIKEY-Account-Id")).toBe(false);
  });

  it("maps all ProductSearch v4 endpoint methods to the documented paths", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({ ok: true }));
    const client = testClient(fetch);

    const calls: Array<[string, () => Promise<unknown>, string, Record<string, string>]> = [
      ["manufacturers", () => client.productSearch.manufacturers(), "/products/v4/search/manufacturers", {}],
      ["categories", () => client.productSearch.categories(), "/products/v4/search/categories", {}],
      ["categoryById", () => client.productSearch.categoryById(32), "/products/v4/search/categories/32", {}],
      [
        "digiReelPricing",
        () => client.productSearch.digiReelPricing("P1", 100),
        "/products/v4/search/P1/digireelpricing",
        { requestedQuantity: "100" }
      ],
      [
        "recommendedProducts",
        () => client.productSearch.recommendedProducts("P1", { limit: 3, searchOptionList: ["A", "B"] }),
        "/products/v4/search/P1/recommendedproducts",
        { limit: "3", searchOptionList: "A,B" }
      ],
      [
        "substitutions",
        () => client.productSearch.substitutions("P1", { includes: "Products" }),
        "/products/v4/search/P1/substitutions",
        { includes: "Products" }
      ],
      ["associations", () => client.productSearch.associations("P1"), "/products/v4/search/P1/associations", {}],
      [
        "packageTypeByQuantity",
        () => client.productSearch.packageTypeByQuantity("P1", 50, { packagingPreference: "DKR" }),
        "/products/v4/search/packagetypebyquantity/P1",
        { requestedQuantity: "50", packagingPreference: "DKR" }
      ],
      ["media", () => client.productSearch.media("P1"), "/products/v4/search/P1/media", {}],
      [
        "productPricing",
        () => client.productSearch.productPricing("P1", { limit: 5, offset: 2, inStock: true }),
        "/products/v4/search/P1/pricing",
        { limit: "5", offset: "2", inStock: "true" }
      ],
      [
        "alternatePackaging",
        () => client.productSearch.alternatePackaging("P1"),
        "/products/v4/search/P1/alternatepackaging",
        {}
      ],
      [
        "pricingOptionsByQuantity",
        () => client.productSearch.pricingOptionsByQuantity("P1", 10, { manufacturerId: "42" }),
        "/products/v4/search/P1/pricingbyquantity/10",
        { manufacturerId: "42" }
      ]
    ];

    for (const [name, call, pathname, query] of calls) {
      fetch.mockClear();
      await call();

      const [input] = fetch.mock.calls[0]!;
      const url = new URL(String(input));
      expect(url.pathname, name).toBe(pathname);
      for (const [key, value] of Object.entries(query)) {
        expect(url.searchParams.get(key), name).toBe(value);
      }
    }
  });

  it("throws DigiKeyApiError for ProductSearch failures", async () => {
    const fetch = vi.fn<FetchLike>(async () =>
      jsonResponse(
        {
          title: "Too Many Requests",
          detail: "Rate limit exceeded",
          correlationId: "correlation-id"
        },
        429,
        "Too Many Requests",
        {
          "Retry-After": "30",
          "X-BurstLimit-Reset": "30"
        }
      )
    );
    const client = testClient(fetch);

    await expect(client.productSearch.categories()).rejects.toMatchObject({
      name: "DigiKeyApiError",
      status: 429,
      requestId: "correlation-id",
      rateLimit: {
        retryAfter: 30,
        burstReset: 30
      }
    } satisfies Partial<DigiKeyApiError>);
  });

  it("allows omitted KeywordSearch body", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({ ProductsCount: 0 }));
    const client = testClient(fetch);

    await client.productSearch.keywordSearch();

    const [, init] = fetch.mock.calls[0]!;
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeUndefined();
  });

  it("validates documented KeywordSearch and ProductPricing numeric ranges", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({}));
    const client = testClient(fetch);

    expect(() => client.productSearch.keywordSearch({ Keywords: "microcontroller", Limit: 51 })).toThrow(
      "Limit must be an integer between 1 and 50."
    );
    expect(() => client.productSearch.keywordSearch({ Keywords: "x".repeat(251) })).toThrow(
      "Keywords must be 250 characters or fewer."
    );
    expect(() => client.productSearch.keywordSearch({ Keywords: "microcontroller", Offset: -1 })).toThrow(
      "Offset must be a non-negative integer."
    );
    expect(() => client.productSearch.productPricing("P1", { limit: 11 })).toThrow(
      "limit must be an integer between 1 and 10."
    );
    expect(() => client.productSearch.productPricing("P1", { offset: -1 })).toThrow(
      "offset must be a non-negative integer."
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it("types endpoint-specific locale options from the official docs", () => {
    const productPricingOptions = {
      locale: {
        site: "UK",
        language: "EN",
        currency: "USD"
      }
    } satisfies ProductPricingOptions;
    const pcnOptions = {
      locale: {
        site: "PH",
        language: "en",
        currency: "PHP",
        shipToCountry: "US"
      }
    } satisfies ProductChangeNotificationsOptions;
    const manufacturersOptions = {
      locale: {
        site: "US",
        language: "en",
        currency: "USD"
      }
    } satisfies ManufacturersOptions;

    expect(productPricingOptions.locale.language).toBe("EN");
    expect(pcnOptions.locale.site).toBe("PH");
    expect(manufacturersOptions.locale.language).toBe("en");

    // @ts-expect-error ProductPricing documents uppercase locale language values.
    const invalidProductPricingLanguage = { locale: { language: "en" } } satisfies ProductPricingOptions;
    // @ts-expect-error ProductSearch endpoints do not document ship-to-country headers.
    const invalidProductSearchShipToCountry = { locale: { shipToCountry: "US" } } satisfies ManufacturersOptions;
    // @ts-expect-error ProductSearch endpoints document lowercase locale language values.
    const invalidProductSearchLanguage = { locale: { language: "EN" } } satisfies MediaOptions;
    // @ts-expect-error Product Change Notifications does not document BR/VN locale sites.
    const invalidPcnSite = { locale: { site: "BR" } } satisfies ProductChangeNotificationsOptions;

    void invalidProductPricingLanguage;
    void invalidProductSearchShipToCountry;
    void invalidProductSearchLanguage;
    void invalidPcnSite;
  });

  it("wraps API transport failures in DigiKeyNetworkError", async () => {
    const fetch = vi.fn<FetchLike>(async () => {
      throw new TypeError("network unreachable");
    });
    const client = testClient(fetch);

    await expect(client.productSearch.categories()).rejects.toMatchObject({
      name: "DigiKeyNetworkError",
      message: "Digi-Key request failed before receiving a response: network unreachable",
      method: "GET",
      isTimeout: false,
      isAbort: false
    } satisfies Partial<DigiKeyNetworkError>);
  });


  it("emits response metadata with parsed rate-limit headers", async () => {
    const onResponse = vi.fn();
    const fetch = vi.fn<FetchLike>(async () =>
      jsonResponse(
        { Categories: [] },
        200,
        "OK",
        {
          "X-RateLimit-Limit": "1000",
          "X-RateLimit-Remaining": "999",
          "X-BurstLimit-Limit": "120",
          "X-BurstLimit-Remaining": "119"
        }
      )
    );
    const client = new DigiKeyClient({
      clientId: "client-id",
      accessToken: "access-token",
      environment: "sandbox",
      onResponse,
      fetch
    });

    await client.productSearch.categories();

    expect(onResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        status: 200,
        url: "https://sandbox-api.digikey.com/products/v4/search/categories",
        rateLimit: expect.objectContaining({
          limit: 1000,
          remaining: 999,
          burstLimit: 120,
          burstRemaining: 119
        })
      })
    );
  });

  it("retries once with a forced token refresh after unauthorized responses", async () => {
    const tokenProvider = {
      getAccessToken: vi.fn(async ({ forceRefresh } = {}) => (forceRefresh ? "fresh-token" : "stale-token"))
    } satisfies TokenProvider;
    const fetch = vi
      .fn<FetchLike>()
      .mockResolvedValueOnce(jsonResponse({ detail: "expired" }, 401, "Unauthorized"))
      .mockResolvedValueOnce(jsonResponse({ Categories: [] }));
    const client = new DigiKeyClient({
      clientId: "client-id",
      tokenProvider,
      environment: "sandbox",
      fetch
    });

    await expect(client.productSearch.categories()).resolves.toEqual({ Categories: [] });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(new Headers(fetch.mock.calls[0]?.[1]?.headers).get("Authorization")).toBe("Bearer stale-token");
    expect(new Headers(fetch.mock.calls[1]?.[1]?.headers).get("Authorization")).toBe("Bearer fresh-token");
    expect(tokenProvider.getAccessToken).toHaveBeenNthCalledWith(1, { forceRefresh: false });
    expect(tokenProvider.getAccessToken).toHaveBeenNthCalledWith(2, { forceRefresh: true });
  });

  it("does not retry unauthorized responses when disabled for a request", async () => {
    const tokenProvider = {
      getAccessToken: vi.fn(async () => "stale-token")
    } satisfies TokenProvider;
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({ detail: "expired" }, 401, "Unauthorized"));
    const client = new DigiKeyClient({
      clientId: "client-id",
      tokenProvider,
      environment: "sandbox",
      fetch
    });

    await expect(client.productSearch.categories({ retryOnUnauthorized: false })).rejects.toMatchObject({
      status: 401
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(tokenProvider.getAccessToken).toHaveBeenCalledTimes(1);
  });

  it("requires account id before calling 2-legged ProductSearch endpoints that need it", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({}));
    const client = new DigiKeyClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      environment: "sandbox",
      fetch
    });

    await expect(client.productSearch.productDetails("P1")).rejects.toMatchObject({
      name: "DigiKeyConfigurationError"
    } satisfies Partial<DigiKeyConfigurationError>);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("allows per-request account id for 2-legged ProductSearch endpoints that need it", async () => {
    const fetch = vi
      .fn<FetchLike>()
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "access-token",
          expires_in: 600
        })
      )
      .mockResolvedValueOnce(jsonResponse({ DigiKeyProductNumber: "P1" }));
    const client = new DigiKeyClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      environment: "sandbox",
      fetch
    });

    await expect(client.productSearch.productDetails("P1", { accountId: "account-id" })).resolves.toEqual({
      DigiKeyProductNumber: "P1"
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(new Headers(fetch.mock.calls[1]?.[1]?.headers).get("X-DIGIKEY-Account-Id")).toBe("account-id");
  });

  it("requires an explicit OAuth flow or account id for raw-token ProductSearch endpoints that may need account id", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({}));
    const client = new DigiKeyClient({
      clientId: "client-id",
      accessToken: "access-token",
      environment: "sandbox",
      fetch
    });

    await expect(client.productSearch.productDetails("P1")).rejects.toMatchObject({
      name: "DigiKeyConfigurationError"
    } satisfies Partial<DigiKeyConfigurationError>);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("allows raw authorization-code tokens on ProductSearch endpoints with optional account id", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({ DigiKeyProductNumber: "P1" }));
    const client = new DigiKeyClient({
      clientId: "client-id",
      accessToken: "access-token",
      oauthFlow: "authorizationCode",
      environment: "sandbox",
      fetch
    });

    await expect(client.productSearch.productDetails("P1")).resolves.toEqual({ DigiKeyProductNumber: "P1" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(new Headers(fetch.mock.calls[0]?.[1]?.headers).has("X-DIGIKEY-Account-Id")).toBe(false);
  });

  it("aborts API requests after the configured timeout", async () => {
    vi.useFakeTimers();
    try {
      const fetch = vi.fn<FetchLike>(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
          })
      );
      const client = testClient(fetch);

      const request = client.productSearch.categories({ timeoutMs: 50 });
      const assertion = expect(request).rejects.toMatchObject({
        name: "DigiKeyNetworkError",
        message: "Digi-Key request timed out after 50ms.",
        isTimeout: true,
        method: "GET"
      } satisfies Partial<DigiKeyNetworkError>);

      await vi.advanceTimersByTimeAsync(50);
      await assertion;
      expect(fetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("applies per-request timeout to token acquisition before API requests", async () => {
    vi.useFakeTimers();
    try {
      const fetch = vi.fn<FetchLike>(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
          })
      );
      const client = new DigiKeyClient({
        clientId: "client-id",
        clientSecret: "client-secret",
        environment: "sandbox",
        accountId: "account-id",
        fetch
      });

      const request = client.productSearch.productDetails("P1", { timeoutMs: 75 });
      const assertion = expect(request).rejects.toMatchObject({
        name: "DigiKeyNetworkError",
        message: "Digi-Key request timed out after 75ms.",
        isTimeout: true,
        method: "POST"
      } satisfies Partial<DigiKeyNetworkError>);

      await vi.advanceTimersByTimeAsync(75);
      await assertion;

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(String(fetch.mock.calls[0]?.[0])).toBe("https://sandbox-api.digikey.com/v1/oauth2/token");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("ProductChangeNotificationsClient", () => {
  it("sends Product Change Notifications requests to the documented v3 path", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({ ProductChangeNotifications: [] }));
    const client = new DigiKeyClient({
      clientId: "client-id",
      accessToken: "access-token",
      oauthFlow: "authorizationCode",
      environment: "sandbox",
      locale: {
        site: "US",
        language: "en",
        currency: "USD"
      },
      fetch
    });

    await client.productChangeNotifications.productChangeNotifications("296-6501-1-ND", {
      Includes: "ProductChangeNotifications(PcnType,PcnDescription)",
      locale: {
        shipToCountry: "US"
      }
    });

    const [input, init] = fetch.mock.calls[0]!;
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);

    expect(url.pathname).toBe("/ChangeNotifications/v3/Products/296-6501-1-ND");
    expect(url.searchParams.get("Includes")).toBe("ProductChangeNotifications(PcnType,PcnDescription)");
    expect(headers.get("X-DIGIKEY-Locale-ShipToCountry")).toBe("US");
    expect(headers.has("X-DIGIKEY-Account-Id")).toBe(false);
  });

  it("keeps backwards compatibility for lowercase Product Change Notifications includes", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({ ProductChangeNotifications: [] }));
    const client = new DigiKeyClient({
      clientId: "client-id",
      accessToken: "access-token",
      oauthFlow: "authorizationCode",
      environment: "sandbox",
      fetch
    });

    await client.productChangeNotifications.productChangeNotifications("296-6501-1-ND", {
      includes: "ProductChangeNotifications(PcnType)"
    });

    const [input] = fetch.mock.calls[0]!;
    const url = new URL(String(input));
    expect(url.searchParams.get("Includes")).toBe("ProductChangeNotifications(PcnType)");
  });

  it("rejects Product Change Notifications when raw-token OAuth flow is not declared", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({}));
    const client = new DigiKeyClient({
      clientId: "client-id",
      accessToken: "access-token",
      environment: "sandbox",
      fetch
    });

    await expect(
      client.productChangeNotifications.productChangeNotifications("296-6501-1-ND")
    ).rejects.toMatchObject({
      name: "DigiKeyConfigurationError"
    } satisfies Partial<DigiKeyConfigurationError>);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects Product Change Notifications when the client is configured for 2-legged OAuth", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({}));
    const client = new DigiKeyClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      environment: "sandbox",
      fetch
    });

    await expect(
      client.productChangeNotifications.productChangeNotifications("296-6501-1-ND")
    ).rejects.toMatchObject({
      name: "DigiKeyConfigurationError"
    } satisfies Partial<DigiKeyConfigurationError>);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("infers authorization-code OAuth flow from DigiKeyRefreshTokenProvider", async () => {
    const fetch = vi
      .fn<FetchLike>()
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "fresh-token",
          refresh_token: "refresh-token-2",
          expires_in: 600
        })
      )
      .mockResolvedValueOnce(jsonResponse({ DigiKeyPartNumber: "296-6501-1-ND", ProductChangeNotifications: [] }));
    const auth = new DigiKeyAuthClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      environment: "sandbox",
      fetch
    });
    const tokenProvider = new DigiKeyRefreshTokenProvider({
      authClient: auth,
      refreshToken: "refresh-token-1"
    });
    const client = new DigiKeyClient({
      clientId: "client-id",
      tokenProvider,
      environment: "sandbox",
      fetch
    });

    await expect(
      client.productChangeNotifications.productChangeNotifications("296-6501-1-ND")
    ).resolves.toMatchObject({
      DigiKeyPartNumber: "296-6501-1-ND"
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(String(fetch.mock.calls[0]?.[0])).toBe("https://sandbox-api.digikey.com/v1/oauth2/token");
    expect(new Headers(fetch.mock.calls[1]?.[1]?.headers).get("Authorization")).toBe("Bearer fresh-token");
  });
});

function testClient(fetch: FetchLike): DigiKeyClient {
  return new DigiKeyClient({
    clientId: "client-id",
    accessToken: "Bearer access-token",
    environment: "sandbox",
    accountId: "account-id",
    locale: {
      site: "US",
      language: "en",
      currency: "USD"
    },
    fetch
  });
}

function jsonResponse(
  body: unknown,
  status = 200,
  statusText = "OK",
  headers: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}
