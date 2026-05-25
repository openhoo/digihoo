import { PRODUCT_SEARCH_BASE_PATH } from "./constants";
import type { components, operations } from "./generated/product-search-v4";
import {
  type DigiKeyHttpClient,
  positiveInteger,
  type QueryParameters,
  splitRequestOptions,
} from "./http";
import type {
  DigiKeyProductPricingLocale,
  DigiKeyProductSearchLocale,
  DigiKeyRequestOptions,
  JsonResponse,
  OperationQuery,
  OperationRequestBody,
} from "./types";

export type ProductSearchSchemas = components["schemas"];
export type ProductSearchOperations = operations;

export type KeywordSearchRequest = OperationRequestBody<ProductSearchOperations["KeywordSearch"]>;
export type KeywordSearchResponse = JsonResponse<ProductSearchOperations["KeywordSearch"]>;
export type ProductDetailsResponse = JsonResponse<ProductSearchOperations["ProductDetails"]>;
export type ManufacturersResponse = JsonResponse<ProductSearchOperations["Manufacturers"]>;
export type CategoriesResponse = JsonResponse<ProductSearchOperations["Categories"]>;
export type CategoryResponse = JsonResponse<ProductSearchOperations["CategoriesById"]>;
export type DigiReelPricingResponse = JsonResponse<ProductSearchOperations["DigiReelPricing"]>;
export type RecommendedProductsResponse = JsonResponse<
  ProductSearchOperations["RecommendedProducts"]
>;
export type ProductSubstitutesResponse = JsonResponse<ProductSearchOperations["Substitutions"]>;
export type ProductAssociationsResponse = JsonResponse<ProductSearchOperations["Associations"]>;
/** @deprecated Digi-Key marks PackageTypeByQuantity as deprecated. Use pricingOptionsByQuantity instead. */
export type PackageTypeByQuantityResponse = JsonResponse<
  ProductSearchOperations["PackageTypeByQuantity"]
>;
export type MediaResponse = JsonResponse<ProductSearchOperations["Media"]>;
export type ProductPricingResponse = JsonResponse<ProductSearchOperations["ProductPricing"]>;
export type AlternatePackagingResponse = JsonResponse<
  ProductSearchOperations["AlternatePackaging"]
>;
export type PricingOptionsByQuantityResponse = JsonResponse<
  ProductSearchOperations["PricingOptionsByQuantity"]
>;

export type ProductSearchRequestOptions = DigiKeyRequestOptions<DigiKeyProductSearchLocale>;
export type ProductPricingRequestOptions = DigiKeyRequestOptions<DigiKeyProductPricingLocale>;

export type KeywordSearchOptions = ProductSearchRequestOptions &
  OperationQuery<ProductSearchOperations["KeywordSearch"]>;
export type ProductDetailsOptions = ProductSearchRequestOptions &
  OperationQuery<ProductSearchOperations["ProductDetails"]>;
export type ManufacturersOptions = ProductSearchRequestOptions;
export type CategoriesOptions = ProductSearchRequestOptions;
export type CategoryByIdOptions = ProductSearchRequestOptions;
export type DigiReelPricingOptions = ProductSearchRequestOptions;
export type RecommendedProductsOptions = ProductSearchRequestOptions &
  Omit<OperationQuery<ProductSearchOperations["RecommendedProducts"]>, "searchOptionList"> & {
    searchOptionList?: string | readonly string[];
  };
export type SubstitutionsOptions = ProductSearchRequestOptions &
  OperationQuery<ProductSearchOperations["Substitutions"]>;
export type ProductAssociationsOptions = ProductSearchRequestOptions;
/** @deprecated Digi-Key marks PackageTypeByQuantity as deprecated. Use PricingOptionsByQuantityOptions instead. */
export type PackageTypeByQuantityOptions = ProductSearchRequestOptions &
  Omit<
    OperationQuery<ProductSearchOperations["PackageTypeByQuantity"]>,
    "requestedQuantity" | "packagingPreference"
  > & {
    packagingPreference?: "CT" | "DKR";
  };
export type MediaOptions = ProductSearchRequestOptions;
export type ProductPricingOptions = ProductPricingRequestOptions &
  OperationQuery<ProductSearchOperations["ProductPricing"]>;
export type AlternatePackagingOptions = ProductSearchRequestOptions;
export type PricingOptionsByQuantityOptions = ProductSearchRequestOptions &
  OperationQuery<ProductSearchOperations["PricingOptionsByQuantity"]>;

export class ProductSearchClient {
  constructor(private readonly http: DigiKeyHttpClient) {}

  keywordSearch(
    body?: KeywordSearchRequest,
    options?: KeywordSearchOptions,
  ): Promise<KeywordSearchResponse> {
    validateKeywordSearchRequest(body);
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<KeywordSearchResponse>({
      method: "POST",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: "/search/keyword",
      query: query as QueryParameters,
      body,
      requestOptions,
      includeAccountId: false,
    });
  }

  productDetails(
    productNumber: string,
    options?: ProductDetailsOptions,
  ): Promise<ProductDetailsResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<ProductDetailsResponse>({
      method: "GET",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: `/search/${encodeURIComponent(productNumber)}/productdetails`,
      query: query as QueryParameters,
      requestOptions,
      requiresAccountIdForClientCredentials: true,
    });
  }

  manufacturers(options?: ManufacturersOptions): Promise<ManufacturersResponse> {
    return this.http.request<ManufacturersResponse>({
      method: "GET",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: "/search/manufacturers",
      requestOptions: options,
      includeAccountId: false,
    });
  }

  categories(options?: CategoriesOptions): Promise<CategoriesResponse> {
    return this.http.request<CategoriesResponse>({
      method: "GET",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: "/search/categories",
      requestOptions: options,
      includeAccountId: false,
    });
  }

  categoryById(categoryId: number, options?: CategoryByIdOptions): Promise<CategoryResponse> {
    return this.http.request<CategoryResponse>({
      method: "GET",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: `/search/categories/${positiveInteger(categoryId, "categoryId")}`,
      requestOptions: options,
      includeAccountId: false,
    });
  }

  digiReelPricing(
    productNumber: string,
    requestedQuantity: number,
    options?: DigiReelPricingOptions,
  ): Promise<DigiReelPricingResponse> {
    return this.http.request<DigiReelPricingResponse>({
      method: "GET",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: `/search/${encodeURIComponent(productNumber)}/digireelpricing`,
      query: {
        requestedQuantity: positiveInteger(requestedQuantity, "requestedQuantity"),
      },
      requestOptions: options,
      requiresAccountIdForClientCredentials: true,
    });
  }

  recommendedProducts(
    productNumber: string,
    options?: RecommendedProductsOptions,
  ): Promise<RecommendedProductsResponse> {
    const [requestOptions, query] = splitRequestOptions(options);
    const normalizedQuery = {
      ...query,
      searchOptionList: Array.isArray(query.searchOptionList)
        ? query.searchOptionList.join(",")
        : query.searchOptionList,
    };

    return this.http.request<RecommendedProductsResponse>({
      method: "GET",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: `/search/${encodeURIComponent(productNumber)}/recommendedproducts`,
      query: normalizedQuery as QueryParameters,
      requestOptions,
      includeAccountId: false,
    });
  }

  substitutions(
    productNumber: string,
    options?: SubstitutionsOptions,
  ): Promise<ProductSubstitutesResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<ProductSubstitutesResponse>({
      method: "GET",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: `/search/${encodeURIComponent(productNumber)}/substitutions`,
      query: query as QueryParameters,
      requestOptions,
      includeAccountId: false,
    });
  }

  associations(
    productNumber: string,
    options?: ProductAssociationsOptions,
  ): Promise<ProductAssociationsResponse> {
    return this.http.request<ProductAssociationsResponse>({
      method: "GET",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: `/search/${encodeURIComponent(productNumber)}/associations`,
      requestOptions: options,
      includeAccountId: false,
    });
  }

  /** @deprecated Digi-Key marks this endpoint as deprecated. Use pricingOptionsByQuantity instead. */
  packageTypeByQuantity(
    productNumber: string,
    requestedQuantity: number,
    options?: PackageTypeByQuantityOptions,
  ): Promise<PackageTypeByQuantityResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<PackageTypeByQuantityResponse>({
      method: "GET",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: `/search/packagetypebyquantity/${encodeURIComponent(productNumber)}`,
      query: {
        ...query,
        requestedQuantity: positiveInteger(requestedQuantity, "requestedQuantity"),
      } as QueryParameters,
      requestOptions,
      requiresAccountIdForClientCredentials: true,
    });
  }

  media(productNumber: string, options?: MediaOptions): Promise<MediaResponse> {
    return this.http.request<MediaResponse>({
      method: "GET",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: `/search/${encodeURIComponent(productNumber)}/media`,
      requestOptions: options,
      includeAccountId: false,
    });
  }

  productPricing(
    productNumber: string,
    options?: ProductPricingOptions,
  ): Promise<ProductPricingResponse> {
    validateProductPricingOptions(options);
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<ProductPricingResponse>({
      method: "GET",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: `/search/${encodeURIComponent(productNumber)}/pricing`,
      query: query as QueryParameters,
      requestOptions,
      requiresAccountIdForClientCredentials: true,
    });
  }

  alternatePackaging(
    productNumber: string,
    options?: AlternatePackagingOptions,
  ): Promise<AlternatePackagingResponse> {
    return this.http.request<AlternatePackagingResponse>({
      method: "GET",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: `/search/${encodeURIComponent(productNumber)}/alternatepackaging`,
      requestOptions: options,
      includeAccountId: false,
    });
  }

  pricingOptionsByQuantity(
    productNumber: string,
    requestedQuantity: number,
    options?: PricingOptionsByQuantityOptions,
  ): Promise<PricingOptionsByQuantityResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<PricingOptionsByQuantityResponse>({
      method: "GET",
      basePath: PRODUCT_SEARCH_BASE_PATH,
      path: `/search/${encodeURIComponent(productNumber)}/pricingbyquantity/${positiveInteger(
        requestedQuantity,
        "requestedQuantity",
      )}`,
      query: query as QueryParameters,
      requestOptions,
      requiresAccountIdForClientCredentials: true,
    });
  }
}

function validateKeywordSearchRequest(body: KeywordSearchRequest | undefined): void {
  if (!body) {
    return;
  }

  if (body.Limit !== undefined) {
    integerInRange(body.Limit, "Limit", 1, 50);
  }

  if (body.Keywords !== undefined && body.Keywords.length > 250) {
    throw new RangeError("Keywords must be 250 characters or fewer.");
  }

  if (body.Offset !== undefined) {
    nonNegativeInteger(body.Offset, "Offset");
  }
}

function validateProductPricingOptions(options: ProductPricingOptions | undefined): void {
  if (!options) {
    return;
  }

  if (options.limit !== undefined) {
    integerInRange(options.limit, "limit", 1, 10);
  }

  if (options.offset !== undefined) {
    nonNegativeInteger(options.offset, "offset");
  }
}

function integerInRange(value: number, name: string, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer between ${min} and ${max}.`);
  }
}

function nonNegativeInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer.`);
  }
}
