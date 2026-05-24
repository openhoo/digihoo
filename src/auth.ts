import { apiBaseUrlForEnvironment, type DigiKeyEnvironment } from "./constants";
import { apiErrorMessage, DigiKeyApiError, DigiKeyNetworkError } from "./errors";
import { resolveRequestSignal } from "./signal";
import type { FetchLike, TokenProvider, TokenRequestContext } from "./types";

export interface DigiKeyAuthClientOptions {
  clientId: string;
  clientSecret: string;
  environment?: DigiKeyEnvironment;
  authBaseUrl?: string;
  fetch?: FetchLike;
  clockSkewMs?: number;
  timeoutMs?: number;
}

export interface AuthorizationUrlOptions {
  redirectUri: string;
  state?: string;
  scope?: string;
}

export interface TokenRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface ClientCredentialsTokenOptions extends TokenRequestOptions {
  forceRefresh?: boolean;
}

export interface AuthorizationCodeTokenOptions extends TokenRequestOptions {
  code: string;
  redirectUri: string;
}

export interface RefreshTokenOptions extends TokenRequestOptions {
  refreshToken: string;
}

export interface DigiKeyRefreshTokenProviderOptions {
  authClient: DigiKeyAuthClient;
  refreshToken: string;
  accessToken?: string;
  expiresAt?: number | Date;
  expiresIn?: number;
  clockSkewMs?: number;
  onToken?: (token: DigiKeyOAuthToken) => void | Promise<void>;
}

export interface DigiKeyOAuthToken {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
  [key: string]: unknown;
}

interface CachedToken {
  token: DigiKeyOAuthToken;
  expiresAt: number;
}

export class DigiKeyAuthClient implements TokenProvider {
  readonly oauthFlow = "clientCredentials";
  readonly clientId: string;
  readonly tokenUrl: string;
  private readonly clientSecret: string;
  private readonly authBaseUrl: string;
  private readonly fetchFn: FetchLike;
  private readonly clockSkewMs: number;
  private readonly timeoutMs?: number;
  private cachedClientCredentialsToken?: CachedToken;
  private clientCredentialsTokenPromise?: Promise<DigiKeyOAuthToken>;

  constructor(options: DigiKeyAuthClientOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.authBaseUrl = options.authBaseUrl ?? apiBaseUrlForEnvironment(options.environment ?? "production");
    this.tokenUrl = new URL("/v1/oauth2/token", this.authBaseUrl).toString();
    this.fetchFn = options.fetch ?? getGlobalFetch();
    this.clockSkewMs = options.clockSkewMs ?? 30_000;
    this.timeoutMs = options.timeoutMs;
  }

  buildAuthorizationUrl(options: AuthorizationUrlOptions): string {
    const url = new URL("/v1/oauth2/authorize", this.authBaseUrl);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", options.redirectUri);

    if (options.state) {
      url.searchParams.set("state", options.state);
    }

    if (options.scope) {
      url.searchParams.set("scope", options.scope);
    }

    return url.toString();
  }

  async getAccessToken(options: ClientCredentialsTokenOptions = {}): Promise<string> {
    const token = await this.getClientCredentialsToken(options);
    return token.access_token;
  }

  async getClientCredentialsToken(options: ClientCredentialsTokenOptions = {}): Promise<DigiKeyOAuthToken> {
    if (!options.forceRefresh && this.cachedClientCredentialsToken && !this.isExpired(this.cachedClientCredentialsToken)) {
      return this.cachedClientCredentialsToken.token;
    }

    const canShareRequest = canShareClientCredentialsRequest(options);

    if (canShareRequest && this.clientCredentialsTokenPromise) {
      return this.clientCredentialsTokenPromise;
    }

    const tokenPromise = this.requestToken(
      {
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret
      },
      options
    ).then((token) => {
      this.cachedClientCredentialsToken = this.cacheableToken(token);
      return token;
    });

    if (!canShareRequest) {
      return tokenPromise;
    }

    this.clientCredentialsTokenPromise = tokenPromise;

    try {
      return await tokenPromise;
    } finally {
      if (this.clientCredentialsTokenPromise === tokenPromise) {
        this.clientCredentialsTokenPromise = undefined;
      }
    }
  }

  async exchangeAuthorizationCode(options: AuthorizationCodeTokenOptions): Promise<DigiKeyOAuthToken> {
    return this.requestToken(
      {
        grant_type: "authorization_code",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: options.code,
        redirect_uri: options.redirectUri
      },
      options
    );
  }

  async refreshAccessToken(options: RefreshTokenOptions): Promise<DigiKeyOAuthToken> {
    return this.requestToken(
      {
        grant_type: "refresh_token",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: options.refreshToken
      },
      options
    );
  }

  private async requestToken(form: Record<string, string>, options: TokenRequestOptions = {}): Promise<DigiKeyOAuthToken> {
    const url = new URL("/v1/oauth2/token", this.authBaseUrl);
    const resolvedSignal = resolveRequestSignal({
      signal: options.signal,
      timeoutMs: options.timeoutMs ?? this.timeoutMs
    });

    let response: Response;
    let parsed: unknown;

    try {
      response = await this.fetchFn(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body: new URLSearchParams(form),
        signal: resolvedSignal.signal
      });
      parsed = await parseResponseBody(response);
    } catch (cause) {
      throw new DigiKeyNetworkError({
        url: url.toString(),
        method: "POST",
        cause
      });
    } finally {
      resolvedSignal.cleanup();
    }

    if (!response.ok) {
      throw new DigiKeyApiError({
        message: apiErrorMessage(response.status, response.statusText, parsed),
        status: response.status,
        statusText: response.statusText,
        url: url.toString(),
        method: "POST",
        details: parsed,
        headers: response.headers
      });
    }

    assertTokenResponse(parsed);
    return parsed;
  }

  private cacheableToken(token: DigiKeyOAuthToken): CachedToken {
    const expiresInMs = typeof token.expires_in === "number" ? token.expires_in * 1000 : 0;

    return {
      token,
      expiresAt: expiresInMs > 0 ? Date.now() + expiresInMs : 0
    };
  }

  private isExpired(cachedToken: CachedToken): boolean {
    return Date.now() + this.clockSkewMs >= cachedToken.expiresAt;
  }
}

export class DigiKeyRefreshTokenProvider implements TokenProvider {
  readonly oauthFlow = "authorizationCode";
  private readonly authClient: DigiKeyAuthClient;
  private readonly clockSkewMs: number;
  private readonly onToken?: (token: DigiKeyOAuthToken) => void | Promise<void>;
  private refreshToken: string;
  private accessToken?: string;
  private expiresAt: number;
  private refreshPromise?: Promise<string>;

  constructor(options: DigiKeyRefreshTokenProviderOptions) {
    this.authClient = options.authClient;
    this.refreshToken = options.refreshToken;
    this.accessToken = options.accessToken;
    this.expiresAt = resolveInitialExpiresAt(options);
    this.clockSkewMs = options.clockSkewMs ?? 30_000;
    this.onToken = options.onToken;
  }

  async getAccessToken(options: TokenRequestContext = {}): Promise<string> {
    if (!options.forceRefresh && this.accessToken && !this.isExpired()) {
      return this.accessToken;
    }

    this.refreshPromise ??= this.startRefresh();
    return waitForRefresh(this.refreshPromise, options, this.authClient.tokenUrl);
  }

  private startRefresh(): Promise<string> {
    const promise = this.refresh().finally(() => {
      if (this.refreshPromise === promise) {
        this.refreshPromise = undefined;
      }
    });

    this.refreshPromise = promise;
    return promise;
  }

  private async refresh(): Promise<string> {
    const token = await this.authClient.refreshAccessToken({
      refreshToken: this.refreshToken
    });

    this.accessToken = token.access_token;
    this.expiresAt = token.expires_in ? Date.now() + token.expires_in * 1000 : 0;

    if (token.refresh_token) {
      this.refreshToken = token.refresh_token;
    }

    await this.onToken?.(token);
    return token.access_token;
  }

  private isExpired(): boolean {
    return Date.now() + this.clockSkewMs >= this.expiresAt;
  }
}

function assertTokenResponse(value: unknown): asserts value is DigiKeyOAuthToken {
  if (!value || typeof value !== "object" || typeof (value as DigiKeyOAuthToken).access_token !== "string") {
    throw new TypeError("Digi-Key OAuth response did not include an access_token.");
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getGlobalFetch(): FetchLike {
  if (typeof globalThis.fetch !== "function") {
    throw new TypeError("A fetch implementation is required in this runtime.");
  }

  return globalThis.fetch.bind(globalThis) as FetchLike;
}

function resolveInitialExpiresAt(options: DigiKeyRefreshTokenProviderOptions): number {
  if (options.expiresAt instanceof Date) {
    return options.expiresAt.getTime();
  }

  if (typeof options.expiresAt === "number") {
    return options.expiresAt;
  }

  if (typeof options.expiresIn === "number") {
    return Date.now() + options.expiresIn * 1000;
  }

  return 0;
}

function canShareClientCredentialsRequest(options: ClientCredentialsTokenOptions): boolean {
  return !options.forceRefresh && options.signal === undefined && options.timeoutMs === undefined;
}

async function waitForRefresh(promise: Promise<string>, options: TokenRequestContext, tokenUrl: string): Promise<string> {
  if (!options.signal && options.timeoutMs === undefined) {
    return promise;
  }

  const resolvedSignal = resolveRequestSignal(options);

  if (resolvedSignal.signal?.aborted) {
    resolvedSignal.cleanup();
    throw new DigiKeyNetworkError({
      url: tokenUrl,
      method: "POST",
      cause: resolvedSignal.signal.reason
    });
  }

  try {
    return await Promise.race([
      promise,
      new Promise<string>((_resolve, reject) => {
        resolvedSignal.signal?.addEventListener(
          "abort",
          () =>
            reject(
              new DigiKeyNetworkError({
                url: tokenUrl,
                method: "POST",
                cause: resolvedSignal.signal?.reason
              })
            ),
          {
            once: true
          }
        );
      })
    ]);
  } finally {
    resolvedSignal.cleanup();
  }
}
