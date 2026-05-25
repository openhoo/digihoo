import { describe, expect, it, vi } from "bun:test";
import type { AddPartsToListIdRequest, FetchLike } from "../src";
import { DigiKeyClient } from "../src";

describe("MyListsClient", () => {
  it("maps MyLists v1 endpoint methods to documented paths", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({ ok: true }));
    const client = authCodeClient(fetch);

    const partBody = [{ RequestedPartNumber: "P1" }] satisfies AddPartsToListIdRequest;
    const calls: Array<[string, () => Promise<unknown>, string, string, Record<string, string>]> = [
      [
        "getListByListId",
        () => client.myLists.getListByListId("list 1"),
        "GET",
        "/mylists/v1/lists/list%201",
        {},
      ],
      [
        "deleteList",
        () => client.myLists.deleteList("list 1"),
        "DELETE",
        "/mylists/v1/lists/list%201",
        {},
      ],
      [
        "lists",
        () => client.myLists.lists({ startIndex: 1, limit: 5 }),
        "GET",
        "/mylists/v1/lists",
        { startIndex: "1", limit: "5" },
      ],
      [
        "createList",
        () => client.myLists.createList({ ListName: "BOM" }),
        "POST",
        "/mylists/v1/lists",
        {},
      ],
      [
        "isValidListName",
        () => client.myLists.isValidListName("BOM"),
        "GET",
        "/mylists/v1/lists/validate/BOM",
        {},
      ],
      [
        "updateListName",
        () => client.myLists.updateListName("list 1", "new name"),
        "PUT",
        "/mylists/v1/lists/list%201/listName/new%20name",
        {},
      ],
      [
        "getPartsByListId",
        () =>
          client.myLists.getPartsByListId("list 1", { countryIso: "US", includeAttrition: true }),
        "GET",
        "/mylists/v1/lists/list%201/parts",
        { countryIso: "US", includeAttrition: "true" },
      ],
      [
        "addPartsToListId",
        () => client.myLists.addPartsToListId("list 1", partBody, { index: 2 }),
        "POST",
        "/mylists/v1/lists/list%201/parts",
        { index: "2" },
      ],
      [
        "getPartFromListByUniqueId",
        () => client.myLists.getPartFromListByUniqueId("list 1", "part 1", { assemblies: 3 }),
        "GET",
        "/mylists/v1/lists/list%201/parts/part%201",
        { assemblies: "3" },
      ],
      [
        "updatePartFromListByUniqueId",
        () =>
          client.myLists.updatePartFromListByUniqueId("list 1", "part 1", partBody[0], {
            createdBy: "me",
          }),
        "PUT",
        "/mylists/v1/lists/list%201/parts/part%201",
        { createdBy: "me" },
      ],
      [
        "deletePartFromListByUniqueId",
        () => client.myLists.deletePartFromListByUniqueId("list 1", "part 1", { createdBy: "me" }),
        "DELETE",
        "/mylists/v1/lists/list%201/parts/part%201",
        { createdBy: "me" },
      ],
      [
        "validListName",
        () => client.myLists.validListName("BOM"),
        "GET",
        "/mylists/v1/lists/validate/name/BOM",
        {},
      ],
    ];

    for (const [name, call, method, pathname, query] of calls) {
      fetch.mockClear();
      await call();

      const [input, init] = fetch.mock.calls[0]!;
      const url = new URL(String(input));
      expect(init?.method, name).toBe(method);
      expect(url.pathname, name).toBe(pathname);
      for (const [key, value] of Object.entries(query)) {
        expect(url.searchParams.get(key), name).toBe(value);
      }
    }
  });

  it("rejects MyLists when the OAuth flow is not declared", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({}));
    const client = new DigiKeyClient({
      clientId: "client-id",
      accessToken: "access-token",
      environment: "sandbox",
      fetch,
    });

    await expect(client.myLists.lists()).rejects.toMatchObject({
      name: "DigiKeyConfigurationError",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});

function authCodeClient(fetch: FetchLike): DigiKeyClient {
  return new DigiKeyClient({
    clientId: "client-id",
    accessToken: "access-token",
    oauthFlow: "authorizationCode",
    environment: "sandbox",
    accountId: "account-id",
    locale: {
      site: "US",
      language: "en",
      currency: "USD",
    },
    fetch,
  });
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
