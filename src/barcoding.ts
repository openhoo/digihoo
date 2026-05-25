import { BARCODING_BASE_PATH, PACKING_LIST_BASE_PATH } from "./constants";
import type {
  components as BarcodingComponents,
  operations as BarcodingOperations,
} from "./generated/barcoding-v3";
import type {
  components as PackingListComponents,
  operations as PackingListOperations,
} from "./generated/packing-list-v1";
import {
  type DigiKeyHttpClient,
  positiveInteger,
  type QueryParameters,
  splitRequestOptions,
} from "./http";
import type { DigiKeyRequestOptions, JsonResponse, OperationQuery, ResponseContent } from "./types";

export type BarcodingSchemas = BarcodingComponents["schemas"];
export type BarcodingOperationsMap = BarcodingOperations;
export type PackingListSchemas = PackingListComponents["schemas"];
export type PackingListOperationsMap = PackingListOperations;

export type ProductBarcodeResponse = JsonResponse<BarcodingOperations["ProductBarcode"]>;
export type Product2DBarcodeResponse = JsonResponse<BarcodingOperations["Product2DBarcode"]>;
export type PackListBarcodeResponse = JsonResponse<BarcodingOperations["PackListBarcode"]>;
export type PackList2DBarcodeResponse = JsonResponse<BarcodingOperations["PackList2DBarcode"]>;
export type GetPackingListResponse = ResponseContent<PackingListOperations["GetPackingList"]>;
export type GetPackingListBySalesOrderIdResponse = ResponseContent<
  PackingListOperations["GetPackingListBySalesOrderId"]
>;
export type GetPackingListByPoNumberResponse = ResponseContent<
  PackingListOperations["GetPackingListByPoNumber"]
>;

export type BarcodeOptions = DigiKeyRequestOptions &
  OperationQuery<BarcodingOperations["ProductBarcode"]>;
export type PackingListOptions = DigiKeyRequestOptions &
  OperationQuery<PackingListOperations["GetPackingList"]>;

export class BarcodingClient {
  constructor(private readonly http: DigiKeyHttpClient) {}

  productBarcode(barcode: string, options?: BarcodeOptions): Promise<ProductBarcodeResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<ProductBarcodeResponse>({
      method: "GET",
      basePath: BARCODING_BASE_PATH,
      path: `/ProductBarcodes/${encodeURIComponent(barcode)}`,
      query: query as QueryParameters,
      requestOptions,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  product2DBarcode(barcode: string, options?: BarcodeOptions): Promise<Product2DBarcodeResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<Product2DBarcodeResponse>({
      method: "GET",
      basePath: BARCODING_BASE_PATH,
      path: `/Product2DBarcodes/${encodeURIComponent(barcode)}`,
      query: query as QueryParameters,
      requestOptions,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  packListBarcode(barcode: string, options?: BarcodeOptions): Promise<PackListBarcodeResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<PackListBarcodeResponse>({
      method: "GET",
      basePath: BARCODING_BASE_PATH,
      path: `/PackListBarcodes/${encodeURIComponent(barcode)}`,
      query: query as QueryParameters,
      requestOptions,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  packList2DBarcode(barcode: string, options?: BarcodeOptions): Promise<PackList2DBarcodeResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<PackList2DBarcodeResponse>({
      method: "GET",
      basePath: BARCODING_BASE_PATH,
      path: `/PackList2DBarcodes/${encodeURIComponent(barcode)}`,
      query: query as QueryParameters,
      requestOptions,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  getPackingList(invoiceId: number, options?: PackingListOptions): Promise<GetPackingListResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<GetPackingListResponse>({
      method: "GET",
      basePath: PACKING_LIST_BASE_PATH,
      path: `/v1/invoice/${positiveInteger(invoiceId, "invoiceId")}`,
      query: query as QueryParameters,
      requestOptions,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  getPackingListBySalesOrderId(
    salesOrderId: number,
    options?: PackingListOptions,
  ): Promise<GetPackingListBySalesOrderIdResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<GetPackingListBySalesOrderIdResponse>({
      method: "GET",
      basePath: PACKING_LIST_BASE_PATH,
      path: `/v1/salesorderid/${positiveInteger(salesOrderId, "salesOrderId")}`,
      query: query as QueryParameters,
      requestOptions,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  getPackingListByPoNumber(
    purchaseOrderNumber: string,
    options?: PackingListOptions,
  ): Promise<GetPackingListByPoNumberResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<GetPackingListByPoNumberResponse>({
      method: "GET",
      basePath: PACKING_LIST_BASE_PATH,
      path: `/v1/purchaseordernumber/${encodeURIComponent(purchaseOrderNumber)}`,
      query: query as QueryParameters,
      requestOptions,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }
}
