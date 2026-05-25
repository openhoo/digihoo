export type DigiKeyEnvironment = "production" | "sandbox";

export const DIGIKEY_API_BASE_URLS: Record<DigiKeyEnvironment, string> = {
  production: "https://api.digikey.com",
  sandbox: "https://sandbox-api.digikey.com",
};

export const PRODUCT_SEARCH_BASE_PATH = "/products/v4";
export const PRODUCT_CHANGE_NOTIFICATIONS_BASE_PATH = "/ChangeNotifications/v3";
export const MYLISTS_BASE_PATH = "/mylists/v1";
export const ORDERING_BASE_PATH = "/Ordering/v3";
export const BARCODING_BASE_PATH = "/Barcoding/v3";
export const PACKING_LIST_BASE_PATH = "/packinglist";
export const ORDER_STATUS_BASE_PATH = "/orderstatus/v4";

export function apiBaseUrlForEnvironment(environment: DigiKeyEnvironment): string {
  return DIGIKEY_API_BASE_URLS[environment];
}
