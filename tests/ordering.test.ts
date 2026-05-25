import { describe, expect, it, vi } from "bun:test";
import type { FetchLike, OrderRequest } from "../src";
import { DigiKeyClient } from "../src";

describe("OrderingClient", () => {
  it("posts Ordering v3 orders with 3-legged OAuth", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({ SalesOrderId: 123 }));
    const client = authCodeClient(fetch);
    const body = {
      PurchaseOrderNumber: "PO-1",
      Currency: "USD",
      ShippingContact: {},
      LineItems: [],
    } as unknown as OrderRequest;

    await client.ordering.order(body);

    const [input, init] = fetch.mock.calls[0]!;
    expect(new URL(String(input)).pathname).toBe("/Ordering/v3/Orders");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify(body));
  });

  it("rejects Ordering when the OAuth flow is not declared", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({}));
    const client = new DigiKeyClient({
      clientId: "client-id",
      accessToken: "access-token",
      environment: "sandbox",
      fetch,
    });

    await expect(client.ordering.order()).rejects.toMatchObject({
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
