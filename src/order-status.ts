import { ORDER_STATUS_BASE_PATH } from "./constants";
import type { components, operations } from "./generated/order-status-v4";
import {
  type DigiKeyHttpClient,
  positiveInteger,
  type QueryParameters,
  splitRequestOptions,
} from "./http";
import type { DigiKeyRequestOptions, JsonResponse, OperationQuery } from "./types";

export type OrderStatusSchemas = components["schemas"];
export type OrderStatusOperations = operations;

export type SearchOrdersResponse = JsonResponse<OrderStatusOperations["SearchOrders"]>;
export type RetrieveSalesOrderResponse = JsonResponse<OrderStatusOperations["RetrieveSalesOrder"]>;

export type OrderStatusRequestOptions = DigiKeyRequestOptions;
export type SearchOrdersOptions = OrderStatusRequestOptions &
  OperationQuery<OrderStatusOperations["SearchOrders"]>;
export type RetrieveSalesOrderOptions = OrderStatusRequestOptions;

export class OrderStatusClient {
  constructor(private readonly http: DigiKeyHttpClient) {}

  searchOrders(options?: SearchOrdersOptions): Promise<SearchOrdersResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<SearchOrdersResponse>({
      method: "GET",
      basePath: ORDER_STATUS_BASE_PATH,
      path: "/orders",
      query: query as QueryParameters,
      requestOptions,
      requiresAccountIdForClientCredentials: true,
    });
  }

  retrieveSalesOrder(
    salesOrderId: number,
    options?: RetrieveSalesOrderOptions,
  ): Promise<RetrieveSalesOrderResponse> {
    return this.http.request<RetrieveSalesOrderResponse>({
      method: "GET",
      basePath: ORDER_STATUS_BASE_PATH,
      path: `/salesorder/${positiveInteger(salesOrderId, "salesOrderId")}`,
      requestOptions: options,
      includeAccountId: false,
    });
  }
}
