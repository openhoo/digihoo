import { DigiKeyAuthClient, type DigiKeyAuthClientOptions } from "./auth";
import { BarcodingClient } from "./barcoding";
import type { DigiKeyEnvironment } from "./constants";
import { DigiKeyHttpClient } from "./http";
import { MyListsClient } from "./mylists";
import { OrderStatusClient } from "./order-status";
import { OrderingClient } from "./ordering";
import { ProductChangeNotificationsClient } from "./product-change-notifications";
import { ProductSearchClient } from "./product-search";
import type {
  DigiKeyLocale,
  DigiKeyOAuthFlow,
  FetchLike,
  ResponseHook,
  TokenProvider,
} from "./types";

export interface DigiKeyClientOptions {
  clientId: string;
  clientSecret?: string;
  accessToken?: string;
  tokenProvider?: TokenProvider;
  authClient?: DigiKeyAuthClient;
  environment?: DigiKeyEnvironment;
  apiBaseUrl?: string;
  authBaseUrl?: string;
  fetch?: FetchLike;
  locale?: DigiKeyLocale;
  accountId?: string;
  defaultHeaders?: HeadersInit;
  clockSkewMs?: number;
  retryOnUnauthorized?: boolean;
  oauthFlow?: DigiKeyOAuthFlow;
  timeoutMs?: number;
  onResponse?: ResponseHook;
}

export class DigiKeyClient {
  readonly auth?: DigiKeyAuthClient;
  readonly barcoding: BarcodingClient;
  readonly myLists: MyListsClient;
  readonly ordering: OrderingClient;
  readonly orderStatus: OrderStatusClient;
  readonly productSearch: ProductSearchClient;
  readonly productChangeNotifications: ProductChangeNotificationsClient;
  readonly productInformation: {
    readonly productSearch: ProductSearchClient;
    readonly productChangeNotifications: ProductChangeNotificationsClient;
  };

  constructor(options: DigiKeyClientOptions) {
    this.auth = options.authClient ?? maybeCreateAuthClient(options);

    const http = new DigiKeyHttpClient({
      clientId: options.clientId,
      environment: options.environment,
      apiBaseUrl: options.apiBaseUrl,
      fetch: options.fetch,
      accessToken: options.accessToken,
      tokenProvider: options.tokenProvider ?? this.auth,
      locale: options.locale,
      accountId: options.accountId,
      defaultHeaders: options.defaultHeaders,
      retryOnUnauthorized: options.retryOnUnauthorized,
      oauthFlow: resolveOAuthFlow(options),
      timeoutMs: options.timeoutMs,
      onResponse: options.onResponse,
    });

    this.barcoding = new BarcodingClient(http);
    this.myLists = new MyListsClient(http);
    this.ordering = new OrderingClient(http);
    this.orderStatus = new OrderStatusClient(http);
    this.productSearch = new ProductSearchClient(http);
    this.productChangeNotifications = new ProductChangeNotificationsClient(http);
    this.productInformation = {
      productSearch: this.productSearch,
      productChangeNotifications: this.productChangeNotifications,
    };
  }

  static sandbox(options: Omit<DigiKeyClientOptions, "environment">): DigiKeyClient {
    return new DigiKeyClient({
      ...options,
      environment: "sandbox",
    });
  }

  static production(options: Omit<DigiKeyClientOptions, "environment">): DigiKeyClient {
    return new DigiKeyClient({
      ...options,
      environment: "production",
    });
  }
}

function resolveOAuthFlow(options: DigiKeyClientOptions): DigiKeyOAuthFlow {
  if (options.oauthFlow) {
    return options.oauthFlow;
  }

  if (options.tokenProvider?.oauthFlow) {
    return options.tokenProvider.oauthFlow;
  }

  if (options.authClient?.oauthFlow) {
    return options.authClient.oauthFlow;
  }

  if (!options.accessToken && options.clientSecret) {
    return "clientCredentials";
  }

  return "unknown";
}

function maybeCreateAuthClient(options: DigiKeyClientOptions): DigiKeyAuthClient | undefined {
  if (!options.clientSecret) {
    return undefined;
  }

  const authOptions: DigiKeyAuthClientOptions = {
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    environment: options.environment,
    authBaseUrl: options.authBaseUrl,
    fetch: options.fetch,
    clockSkewMs: options.clockSkewMs,
    timeoutMs: options.timeoutMs,
  };

  return new DigiKeyAuthClient(authOptions);
}
