import { ORDERING_BASE_PATH } from "./constants";
import type { components, operations } from "./generated/ordering-v3";
import type { DigiKeyHttpClient } from "./http";
import type { DigiKeyRequestOptions, JsonResponse, OperationRequestBody } from "./types";

export type OrderingSchemas = components["schemas"];
export type OrderingOperations = operations;

export type OrderRequest = OperationRequestBody<OrderingOperations["Order"]>;
export type OrderResponse = JsonResponse<OrderingOperations["Order"]>;
export type OrderOptions = DigiKeyRequestOptions;

export class OrderingClient {
  constructor(private readonly http: DigiKeyHttpClient) {}

  order(body?: OrderRequest, options?: OrderOptions): Promise<OrderResponse> {
    return this.http.request<OrderResponse>({
      method: "POST",
      basePath: ORDERING_BASE_PATH,
      path: "/Orders",
      body,
      requestOptions: options,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }
}
