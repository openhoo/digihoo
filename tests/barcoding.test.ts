import { describe, expect, it, vi } from "bun:test";
import type { FetchLike } from "../src";
import { DigiKeyClient } from "../src";

describe("BarcodingClient", () => {
  it("maps Barcode and PackingList endpoints to documented paths", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({ ok: true }));
    const client = authCodeClient(fetch);
    const calls: Array<[string, () => Promise<unknown>, string, Record<string, string>]> = [
      [
        "productBarcode",
        () =>
          client.barcoding.productBarcode("abc 123", { includes: "DigiKeyPartNumber,Quantity" }),
        "/Barcoding/v3/ProductBarcodes/abc%20123",
        { includes: "DigiKeyPartNumber,Quantity" },
      ],
      [
        "product2DBarcode",
        () => client.barcoding.product2DBarcode("qr 123"),
        "/Barcoding/v3/Product2DBarcodes/qr%20123",
        {},
      ],
      [
        "packListBarcode",
        () => client.barcoding.packListBarcode("pack 1"),
        "/Barcoding/v3/PackListBarcodes/pack%201",
        {},
      ],
      [
        "packList2DBarcode",
        () => client.barcoding.packList2DBarcode("pack 2"),
        "/Barcoding/v3/PackList2DBarcodes/pack%202",
        {},
      ],
      [
        "getPackingList",
        () => client.barcoding.getPackingList(123, { includePdf: true }),
        "/packinglist/v1/invoice/123",
        { includePdf: "true" },
      ],
      [
        "getPackingListBySalesOrderId",
        () => client.barcoding.getPackingListBySalesOrderId(456),
        "/packinglist/v1/salesorderid/456",
        {},
      ],
      [
        "getPackingListByPoNumber",
        () => client.barcoding.getPackingListByPoNumber("PO 1"),
        "/packinglist/v1/purchaseordernumber/PO%201",
        {},
      ],
    ];

    for (const [name, call, pathname, query] of calls) {
      fetch.mockClear();
      await call();

      const [input] = fetch.mock.calls[0]!;
      const url = new URL(String(input));
      expect(url.pathname, name).toBe(pathname);
      for (const [key, value] of Object.entries(query)) {
        expect(url.searchParams.get(key), name).toBe(value);
      }
    }
  });

  it("rejects Barcoding when the OAuth flow is not declared", async () => {
    const fetch = vi.fn<FetchLike>(async () => jsonResponse({}));
    const client = new DigiKeyClient({
      clientId: "client-id",
      accessToken: "access-token",
      environment: "sandbox",
      fetch,
    });

    await expect(client.barcoding.productBarcode("barcode")).rejects.toMatchObject({
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
