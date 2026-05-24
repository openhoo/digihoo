import { parseRateLimitHeaders, type DigiKeyRateLimit } from "./response-metadata";

export interface DigiKeyApiErrorOptions {
  message: string;
  status: number;
  statusText: string;
  url: string;
  method: string;
  details?: unknown;
  headers?: Headers;
}

export interface DigiKeyNetworkErrorOptions {
  url: string;
  method: string;
  cause: unknown;
}

export class DigiKeyApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly method: string;
  readonly details?: unknown;
  readonly requestId?: string;
  readonly responseHeaders: Headers;
  readonly rateLimit: DigiKeyRateLimit;

  constructor(options: DigiKeyApiErrorOptions) {
    super(options.message);
    this.name = "DigiKeyApiError";
    this.status = options.status;
    this.statusText = options.statusText;
    this.url = options.url;
    this.method = options.method;
    this.details = options.details;
    this.responseHeaders = options.headers ?? new Headers();
    this.rateLimit = parseRateLimitHeaders(this.responseHeaders);
    this.requestId =
      readStringProperty(options.details, "RequestId") ??
      readStringProperty(options.details, "correlationId") ??
      this.responseHeaders.get("x-request-id") ??
      undefined;
  }
}

export class DigiKeyNetworkError extends Error {
  readonly url: string;
  readonly method: string;
  override readonly cause: unknown;
  readonly isTimeout: boolean;
  readonly isAbort: boolean;

  constructor(options: DigiKeyNetworkErrorOptions) {
    super(networkErrorMessage(options.cause), { cause: options.cause });
    this.name = "DigiKeyNetworkError";
    this.url = options.url;
    this.method = options.method;
    this.cause = options.cause;
    this.isTimeout = readErrorName(options.cause) === "TimeoutError";
    this.isAbort = readErrorName(options.cause) === "AbortError";
  }
}

export class DigiKeyConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DigiKeyConfigurationError";
  }
}

export function apiErrorMessage(
  status: number,
  statusText: string,
  details: unknown
): string {
  const detail =
    readStringProperty(details, "detail") ??
    readStringProperty(details, "ErrorMessage") ??
    readStringProperty(details, "ErrorDetails") ??
    readStringProperty(details, "title");

  return detail ? `Digi-Key API error ${status}: ${detail}` : `Digi-Key API error ${status}: ${statusText}`;
}

function readStringProperty(value: unknown, property: string): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const found = (value as Record<string, unknown>)[property];
  return typeof found === "string" && found.length > 0 ? found : undefined;
}

function networkErrorMessage(cause: unknown): string {
  const message = readErrorMessage(cause);
  const name = readErrorName(cause);

  if (name === "TimeoutError" && message) {
    return message;
  }

  return message
    ? `Digi-Key request failed before receiving a response: ${message}`
    : "Digi-Key request failed before receiving a response.";
}

function readErrorName(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const name = (value as { name?: unknown }).name;
  return typeof name === "string" ? name : undefined;
}

function readErrorMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const message = (value as { message?: unknown }).message;
  return typeof message === "string" && message.length > 0 ? message : undefined;
}
