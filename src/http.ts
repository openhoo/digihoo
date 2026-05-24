import { apiBaseUrlForEnvironment, type DigiKeyEnvironment } from "./constants";
import { apiErrorMessage, DigiKeyApiError, DigiKeyConfigurationError, DigiKeyNetworkError } from "./errors";
import { responseMetadata } from "./response-metadata";
import { resolveRequestSignal } from "./signal";
import type { DigiKeyLocale, DigiKeyOAuthFlow, DigiKeyRequestOptions, FetchLike, ResponseHook, TokenProvider } from "./types";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParameters = Record<string, QueryValue | readonly QueryValue[]>;

export interface DigiKeyHttpClientOptions {
  clientId: string;
  environment?: DigiKeyEnvironment;
  apiBaseUrl?: string;
  fetch?: FetchLike;
  accessToken?: string;
  tokenProvider?: TokenProvider;
  locale?: DigiKeyLocale;
  accountId?: string;
  defaultHeaders?: HeadersInit;
  retryOnUnauthorized?: boolean;
  oauthFlow?: DigiKeyOAuthFlow;
  timeoutMs?: number;
  onResponse?: ResponseHook;
}

export interface HttpRequestOptions {
  method: "GET" | "POST";
  basePath: string;
  path: string;
  query?: QueryParameters;
  body?: unknown;
  requestOptions?: DigiKeyRequestOptions;
  includeAccountId?: boolean;
  includeShipToCountry?: boolean;
  retryOnUnauthorized?: boolean;
  requiresAccountIdForClientCredentials?: boolean;
  requiredOAuthFlow?: Exclude<DigiKeyOAuthFlow, "unknown">;
}

export class DigiKeyHttpClient {
  private readonly clientId: string;
  private readonly apiBaseUrl: string;
  private readonly fetchFn: FetchLike;
  private readonly accessToken?: string;
  private readonly tokenProvider?: TokenProvider;
  private readonly locale?: DigiKeyLocale;
  private readonly accountId?: string;
  private readonly defaultHeaders?: HeadersInit;
  private readonly retryOnUnauthorized: boolean;
  private readonly oauthFlow: DigiKeyOAuthFlow;
  private readonly timeoutMs?: number;
  private readonly onResponse?: ResponseHook;

  constructor(options: DigiKeyHttpClientOptions) {
    this.clientId = options.clientId;
    this.apiBaseUrl = options.apiBaseUrl ?? apiBaseUrlForEnvironment(options.environment ?? "production");
    this.fetchFn = options.fetch ?? getGlobalFetch();
    this.accessToken = options.accessToken;
    this.tokenProvider = options.tokenProvider;
    this.locale = options.locale;
    this.accountId = options.accountId;
    this.defaultHeaders = options.defaultHeaders;
    this.retryOnUnauthorized = options.retryOnUnauthorized ?? true;
    this.oauthFlow = options.oauthFlow ?? "unknown";
    this.timeoutMs = options.timeoutMs;
    this.onResponse = options.onResponse;
  }

  async request<T>(options: HttpRequestOptions): Promise<T> {
    this.validateRequestConfiguration(options);
    let result = await this.send(options, false);

    if (!result.response.ok && result.response.status === 401 && this.shouldRetryUnauthorized(options)) {
      result = await this.send(options, true);
    }

    if (!result.response.ok) {
      throw new DigiKeyApiError({
        message: apiErrorMessage(result.response.status, result.response.statusText, result.parsed),
        status: result.response.status,
        statusText: result.response.statusText,
        url: result.url.toString(),
        method: options.method,
        details: result.parsed,
        headers: result.response.headers
      });
    }

    return result.parsed as T;
  }

  private async send(
    options: HttpRequestOptions,
    forceRefreshToken: boolean
  ): Promise<{ url: URL; response: Response; parsed: unknown }> {
    const url = this.buildUrl(options.basePath, options.path, options.query);
    const headers = await this.buildHeaders(options, forceRefreshToken);
    const resolvedSignal = resolveRequestSignal({
      signal: options.requestOptions?.signal,
      timeoutMs: options.requestOptions?.timeoutMs ?? this.timeoutMs
    });

    let response: Response;
    let parsed: unknown;

    try {
      response = await this.fetchFn(url, {
        method: options.method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: resolvedSignal.signal
      });
      parsed = await parseResponseBody(response);
    } catch (cause) {
      throw new DigiKeyNetworkError({
        url: url.toString(),
        method: options.method,
        cause
      });
    } finally {
      resolvedSignal.cleanup();
    }

    await this.onResponse?.(
      responseMetadata({
        url,
        method: options.method,
        response
      })
    );

    return { url, response, parsed };
  }

  private buildUrl(basePath: string, path: string, query?: QueryParameters): URL {
    const pathname = `${trimRight(basePath, "/")}/${trimLeft(path, "/")}`;
    const url = new URL(pathname, this.apiBaseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        appendQueryParameter(url.searchParams, key, value);
      }
    }

    return url;
  }

  private async buildHeaders(options: HttpRequestOptions, forceRefreshToken: boolean): Promise<Headers> {
    const headers = new Headers(this.defaultHeaders);
    const requestOptions = options.requestOptions;

    headers.set("Accept", "application/json");
    headers.set("Authorization", `Bearer ${normalizeBearerToken(await this.resolveAccessToken(forceRefreshToken, options))}`);
    headers.set("X-DIGIKEY-Client-Id", this.clientId);

    if (options.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const locale = {
      ...this.locale,
      ...requestOptions?.locale
    };

    setOptionalHeader(headers, "X-DIGIKEY-Locale-Site", locale.site);
    setOptionalHeader(headers, "X-DIGIKEY-Locale-Language", locale.language);
    setOptionalHeader(headers, "X-DIGIKEY-Locale-Currency", locale.currency);

    if (options.includeShipToCountry) {
      setOptionalHeader(headers, "X-DIGIKEY-Locale-ShipToCountry", locale.shipToCountry);
    }

    if (options.includeAccountId ?? true) {
      setOptionalHeader(headers, "X-DIGIKEY-Account-Id", requestOptions?.accountId ?? this.accountId);
    }

    if (requestOptions?.headers) {
      for (const [key, value] of new Headers(requestOptions.headers)) {
        headers.set(key, value);
      }
    }

    return headers;
  }

  private async resolveAccessToken(forceRefresh: boolean, options: HttpRequestOptions): Promise<string> {
    if (!forceRefresh && this.accessToken) {
      return this.accessToken;
    }

    if (this.tokenProvider) {
      return this.tokenProvider.getAccessToken({
        forceRefresh,
        signal: options.requestOptions?.signal,
        timeoutMs: options.requestOptions?.timeoutMs ?? this.timeoutMs
      });
    }

    if (this.accessToken) {
      return this.accessToken;
    }

    throw new TypeError("A Digi-Key accessToken, tokenProvider, or clientSecret is required for API requests.");
  }

  private shouldRetryUnauthorized(options: HttpRequestOptions): boolean {
    const retry =
      options.requestOptions?.retryOnUnauthorized ??
      options.retryOnUnauthorized ??
      this.retryOnUnauthorized;

    return retry && this.tokenProvider !== undefined;
  }

  private validateRequestConfiguration(options: HttpRequestOptions): void {
    if (options.requiredOAuthFlow && this.oauthFlow !== options.requiredOAuthFlow) {
      if (this.oauthFlow === "unknown") {
        throw new DigiKeyConfigurationError(
          `This Digi-Key endpoint requires ${formatOAuthFlow(options.requiredOAuthFlow)} OAuth. Configure oauthFlow on the client or use a TokenProvider that declares oauthFlow.`
        );
      }

      throw new DigiKeyConfigurationError(
        `This Digi-Key endpoint requires ${formatOAuthFlow(options.requiredOAuthFlow)} OAuth, but the client is configured for ${formatOAuthFlow(this.oauthFlow)} OAuth.`
      );
    }

    const accountId = options.requestOptions?.accountId ?? this.accountId;
    if (options.requiresAccountIdForClientCredentials && this.oauthFlow === "clientCredentials" && !accountId) {
      throw new DigiKeyConfigurationError(
        "X-DIGIKEY-Account-Id is required for this Digi-Key ProductSearch endpoint when using 2-legged OAuth. Configure accountId on the client or pass it in the request options."
      );
    }

    if (options.requiresAccountIdForClientCredentials && this.oauthFlow === "unknown" && !accountId) {
      throw new DigiKeyConfigurationError(
        "This Digi-Key ProductSearch endpoint requires X-DIGIKEY-Account-Id when using 2-legged OAuth. Configure oauthFlow: \"authorizationCode\" for a 3-legged token, or configure accountId for 2-legged OAuth."
      );
    }
  }
}

export function splitRequestOptions<T extends DigiKeyRequestOptions>(
  options: T | undefined
): [DigiKeyRequestOptions | undefined, Omit<T, keyof DigiKeyRequestOptions>] {
  if (!options) {
    return [undefined, {} as Omit<T, keyof DigiKeyRequestOptions>];
  }

  const { signal, timeoutMs, headers, locale, accountId, retryOnUnauthorized, ...query } = options;
  return [
    {
      signal,
      timeoutMs,
      headers,
      locale,
      accountId,
      retryOnUnauthorized
    },
    query as Omit<T, keyof DigiKeyRequestOptions>
  ];
}

export function positiveInteger(value: number, name: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer.`);
  }

  return value;
}

function appendQueryParameter(
  searchParams: URLSearchParams,
  key: string,
  value: QueryValue | readonly QueryValue[]
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryParameter(searchParams, key, item);
    }
    return;
  }

  if (value === undefined || value === null) {
    return;
  }

  searchParams.append(key, String(value));
}

function setOptionalHeader(headers: Headers, key: string, value: string | undefined): void {
  if (value) {
    headers.set(key, value);
  }
}

function normalizeBearerToken(token: string): string {
  return token.replace(/^Bearer(?:Token)?\s+/i, "");
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

function trimLeft(value: string, character: string): string {
  let result = value;
  while (result.startsWith(character)) {
    result = result.slice(character.length);
  }
  return result;
}

function trimRight(value: string, character: string): string {
  let result = value;
  while (result.endsWith(character)) {
    result = result.slice(0, -character.length);
  }
  return result;
}

function getGlobalFetch(): FetchLike {
  if (typeof globalThis.fetch !== "function") {
    throw new TypeError("A fetch implementation is required in this runtime.");
  }

  return globalThis.fetch.bind(globalThis) as FetchLike;
}

function formatOAuthFlow(flow: DigiKeyOAuthFlow): string {
  switch (flow) {
    case "clientCredentials":
      return "2-legged client credentials";
    case "authorizationCode":
      return "3-legged authorization code";
    case "unknown":
      return "unknown";
  }
}
