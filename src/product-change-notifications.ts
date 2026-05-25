import { PRODUCT_CHANGE_NOTIFICATIONS_BASE_PATH } from "./constants";
import type { components, operations } from "./generated/product-change-notifications-v3";
import { type DigiKeyHttpClient, type QueryParameters, splitRequestOptions } from "./http";
import type {
  DigiKeyProductChangeNotificationsLocale,
  DigiKeyRequestOptions,
  JsonResponse,
  OperationQuery,
} from "./types";

export type ProductChangeNotificationSchemas = components["schemas"];
export type ProductChangeNotificationOperations = operations;
export type ProductChangeNotificationsResponse = JsonResponse<
  ProductChangeNotificationOperations["ProductChangeNotifications"]
>;
export type ProductChangeNotificationsQuery = OperationQuery<
  ProductChangeNotificationOperations["ProductChangeNotifications"]
>;

export type ProductChangeNotificationsRequestOptions =
  DigiKeyRequestOptions<DigiKeyProductChangeNotificationsLocale>;

export type ProductChangeNotificationsOptions = ProductChangeNotificationsRequestOptions &
  ProductChangeNotificationsQuery & {
    /** @deprecated Use the official Digi-Key query name `Includes`. */
    includes?: string;
  };

export class ProductChangeNotificationsClient {
  constructor(private readonly http: DigiKeyHttpClient) {}

  productChangeNotifications(
    digiKeyPartNumber: string,
    options?: ProductChangeNotificationsOptions,
  ): Promise<ProductChangeNotificationsResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<ProductChangeNotificationsResponse>({
      method: "GET",
      basePath: PRODUCT_CHANGE_NOTIFICATIONS_BASE_PATH,
      path: `/Products/${encodeURIComponent(digiKeyPartNumber)}`,
      query: {
        Includes: query.Includes ?? query.includes,
      } as QueryParameters,
      requestOptions,
      includeAccountId: false,
      includeShipToCountry: true,
      requiredOAuthFlow: "authorizationCode",
    });
  }
}
