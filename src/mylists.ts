import { MYLISTS_BASE_PATH } from "./constants";
import type { components, operations } from "./generated/mylists-v1";
import { type DigiKeyHttpClient, type QueryParameters, splitRequestOptions } from "./http";
import type {
  DigiKeyRequestOptions,
  JsonResponse,
  OperationQuery,
  OperationRequestBody,
} from "./types";

export type MyListsSchemas = components["schemas"];
export type MyListsOperations = operations;

export type GetListByListIdResponse = JsonResponse<MyListsOperations["GetListByListId"]>;
export type DeleteListResponse = undefined;
export type ListsResponse = JsonResponse<MyListsOperations["Lists"]>;
export type CreateListRequest = OperationRequestBody<MyListsOperations["CreateList"]>;
export type CreateListResponse = JsonResponse<MyListsOperations["CreateList"]>;
export type IsValidListNameResponse = JsonResponse<MyListsOperations["IsValidListName"]>;
export type UpdateListNameResponse = undefined;
export type GetPartsByListIdResponse = JsonResponse<MyListsOperations["GetPartsByListId"]>;
export type AddPartsToListIdRequest = OperationRequestBody<MyListsOperations["AddPartsToListId"]>;
export type AddPartsToListIdResponse = JsonResponse<MyListsOperations["AddPartsToListId"]>;
export type GetPartFromListByUniqueIdResponse = JsonResponse<
  MyListsOperations["GetPartFromListByUniqueId"]
>;
export type UpdatePartFromListByUniqueIdRequest = OperationRequestBody<
  MyListsOperations["UpdatePartFromListByUniqueId"]
>;
export type UpdatePartFromListByUniqueIdResponse = undefined;
export type DeletePartFromListByUniqueIdResponse = undefined;
export type ValidListNameResponse = JsonResponse<MyListsOperations["ValidListName"]>;

export type MyListsRequestOptions = DigiKeyRequestOptions;
export type ListsOptions = MyListsRequestOptions & OperationQuery<MyListsOperations["Lists"]>;
export type CreateListOptions = MyListsRequestOptions;
export type GetListByListIdOptions = MyListsRequestOptions;
export type DeleteListOptions = MyListsRequestOptions;
export type IsValidListNameOptions = MyListsRequestOptions;
export type UpdateListNameOptions = MyListsRequestOptions;
export type GetPartsByListIdOptions = MyListsRequestOptions &
  OperationQuery<MyListsOperations["GetPartsByListId"]>;
export type AddPartsToListIdOptions = MyListsRequestOptions &
  OperationQuery<MyListsOperations["AddPartsToListId"]>;
export type GetPartFromListByUniqueIdOptions = MyListsRequestOptions &
  OperationQuery<MyListsOperations["GetPartFromListByUniqueId"]>;
export type UpdatePartFromListByUniqueIdOptions = MyListsRequestOptions &
  OperationQuery<MyListsOperations["UpdatePartFromListByUniqueId"]>;
export type DeletePartFromListByUniqueIdOptions = MyListsRequestOptions &
  OperationQuery<MyListsOperations["DeletePartFromListByUniqueId"]>;
export type ValidListNameOptions = MyListsRequestOptions;

export class MyListsClient {
  constructor(private readonly http: DigiKeyHttpClient) {}

  getListByListId(
    listId: string,
    options?: GetListByListIdOptions,
  ): Promise<GetListByListIdResponse> {
    return this.http.request<GetListByListIdResponse>({
      method: "GET",
      basePath: MYLISTS_BASE_PATH,
      path: `/lists/${encodeURIComponent(listId)}`,
      requestOptions: options,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  deleteList(listId: string, options?: DeleteListOptions): Promise<DeleteListResponse> {
    return this.http.request<DeleteListResponse>({
      method: "DELETE",
      basePath: MYLISTS_BASE_PATH,
      path: `/lists/${encodeURIComponent(listId)}`,
      requestOptions: options,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  lists(options?: ListsOptions): Promise<ListsResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<ListsResponse>({
      method: "GET",
      basePath: MYLISTS_BASE_PATH,
      path: "/lists",
      query: query as QueryParameters,
      requestOptions,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  createList(body?: CreateListRequest, options?: CreateListOptions): Promise<CreateListResponse> {
    return this.http.request<CreateListResponse>({
      method: "POST",
      basePath: MYLISTS_BASE_PATH,
      path: "/lists",
      body,
      requestOptions: options,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  isValidListName(
    listName: string,
    options?: IsValidListNameOptions,
  ): Promise<IsValidListNameResponse> {
    return this.http.request<IsValidListNameResponse>({
      method: "GET",
      basePath: MYLISTS_BASE_PATH,
      path: `/lists/validate/${encodeURIComponent(listName)}`,
      requestOptions: options,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  updateListName(
    listId: string,
    listName: string,
    options?: UpdateListNameOptions,
  ): Promise<UpdateListNameResponse> {
    return this.http.request<UpdateListNameResponse>({
      method: "PUT",
      basePath: MYLISTS_BASE_PATH,
      path: `/lists/${encodeURIComponent(listId)}/listName/${encodeURIComponent(listName)}`,
      requestOptions: options,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  getPartsByListId(
    listId: string,
    options?: GetPartsByListIdOptions,
  ): Promise<GetPartsByListIdResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<GetPartsByListIdResponse>({
      method: "GET",
      basePath: MYLISTS_BASE_PATH,
      path: `/lists/${encodeURIComponent(listId)}/parts`,
      query: query as QueryParameters,
      requestOptions,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  addPartsToListId(
    listId: string,
    body?: AddPartsToListIdRequest,
    options?: AddPartsToListIdOptions,
  ): Promise<AddPartsToListIdResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<AddPartsToListIdResponse>({
      method: "POST",
      basePath: MYLISTS_BASE_PATH,
      path: `/lists/${encodeURIComponent(listId)}/parts`,
      query: query as QueryParameters,
      body,
      requestOptions,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  getPartFromListByUniqueId(
    listId: string,
    uniqueId: string,
    options?: GetPartFromListByUniqueIdOptions,
  ): Promise<GetPartFromListByUniqueIdResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<GetPartFromListByUniqueIdResponse>({
      method: "GET",
      basePath: MYLISTS_BASE_PATH,
      path: `/lists/${encodeURIComponent(listId)}/parts/${encodeURIComponent(uniqueId)}`,
      query: query as QueryParameters,
      requestOptions,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  updatePartFromListByUniqueId(
    listId: string,
    uniqueId: string,
    body?: UpdatePartFromListByUniqueIdRequest,
    options?: UpdatePartFromListByUniqueIdOptions,
  ): Promise<UpdatePartFromListByUniqueIdResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<UpdatePartFromListByUniqueIdResponse>({
      method: "PUT",
      basePath: MYLISTS_BASE_PATH,
      path: `/lists/${encodeURIComponent(listId)}/parts/${encodeURIComponent(uniqueId)}`,
      query: query as QueryParameters,
      body,
      requestOptions,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  deletePartFromListByUniqueId(
    listId: string,
    uniqueId: string,
    options?: DeletePartFromListByUniqueIdOptions,
  ): Promise<DeletePartFromListByUniqueIdResponse> {
    const [requestOptions, query] = splitRequestOptions(options);

    return this.http.request<DeletePartFromListByUniqueIdResponse>({
      method: "DELETE",
      basePath: MYLISTS_BASE_PATH,
      path: `/lists/${encodeURIComponent(listId)}/parts/${encodeURIComponent(uniqueId)}`,
      query: query as QueryParameters,
      requestOptions,
      includeAccountId: false,
      requiredOAuthFlow: "authorizationCode",
    });
  }

  validListName(listName: string, options?: ValidListNameOptions): Promise<ValidListNameResponse> {
    return this.http.request<ValidListNameResponse>({
      method: "GET",
      basePath: MYLISTS_BASE_PATH,
      path: `/lists/validate/name/${encodeURIComponent(listName)}`,
      requestOptions: options,
      requiredOAuthFlow: "authorizationCode",
    });
  }
}
