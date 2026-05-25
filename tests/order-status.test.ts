import { describe, expect, it, vi } from "bun:test";
import type { FetchLike } from "../src";
import { DigiKeyClient } from "../src";

describe("OrderStatusClient", () => {
  it("maps OrderStatus v4 paths and requires account id for 2-legged search", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({ Orders: [] }));
    const client = new DigiKeyClient({
      clientId: "client-id",
      accessToken: "access-token",
      oauthFlow: "clientCredentials",
      environment: "sandbox",
      accountId: "account-id",
      fetch,
    });

    await client.orderStatus.searchOrders({ Shared: true, PageSize: 25 });
    await client.orderStatus.retrieveSalesOrder(123);

    const searchUrl = new URL(String(fetch.mock.calls[0]?.[0]));
    const searchHeaders = new Headers(fetch.mock.calls[0]?.[1]?.headers);
    expect(searchUrl.pathname).toBe("/orderstatus/v4/orders");
    expect(searchUrl.searchParams.get("Shared")).toBe("true");
    expect(searchUrl.searchParams.get("PageSize")).toBe("25");
    expect(searchHeaders.get("X-DIGIKEY-Account-Id")).toBe("account-id");

    const retrieveUrl = new URL(String(fetch.mock.calls[1]?.[0]));
    const retrieveHeaders = new Headers(fetch.mock.calls[1]?.[1]?.headers);
    expect(retrieveUrl.pathname).toBe("/orderstatus/v4/salesorder/123");
    expect(retrieveHeaders.has("X-DIGIKEY-Account-Id")).toBe(false);
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
