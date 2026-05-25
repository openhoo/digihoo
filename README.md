# digihoo

[![npm version](https://img.shields.io/npm/v/%40openhoo%2Fdigihoo?label=npm)](https://www.npmjs.com/package/@openhoo/digihoo)
![coverage](https://img.shields.io/badge/coverage-95%25%2B-brightgreen)

TypeScript SDK for Digi-Key API authentication and the Product Information APIs.

This package is built against Digi-Key's official documentation:

- OAuth documentation: https://developer.digikey.com/documentation/oauth
- ProductSearch v4: https://developer.digikey.com/products/product-information-v4/productsearch
- Product Change Notifications v3: https://developer.digikey.com/products/product-information-v4/productchangenotifications

## Install

```sh
npm install digihoo
```

## OAuth client credentials

```ts
import { DigiKeyClient } from "digihoo";

const client = new DigiKeyClient({
  clientId: process.env.DIGIKEY_CLIENT_ID!,
  clientSecret: process.env.DIGIKEY_CLIENT_SECRET!,
  environment: "sandbox",
  locale: {
    site: "US",
    language: "en",
    currency: "USD"
  },
  accountId: process.env.DIGIKEY_ACCOUNT_ID
});

const details = await client.productSearch.productDetails("296-6501-1-ND");
```

When a `TokenProvider` or `clientSecret` is configured, API calls retry once after a `401` by requesting a fresh token. Pass `retryOnUnauthorized: false` on the client or on an individual request to disable that behavior.

For 2-legged OAuth, Digi-Key requires `X-DIGIKEY-Account-Id` on ProductSearch endpoints that return account-specific pricing. Configure `accountId` on the client or pass it per request.

When using a raw `accessToken`, set `oauthFlow` for endpoints with flow-specific rules. Product Change Notifications requires `oauthFlow: "authorizationCode"`. ProductSearch pricing endpoints require either `oauthFlow: "authorizationCode"` for a 3-legged token or an `accountId` for 2-legged OAuth.

Locale options are typed with Digi-Key's documented site, language, currency, and ISO ship-to-country codes.
Endpoint-specific locale differences are modeled on request options; for example, `productPricing` accepts Digi-Key's documented uppercase locale language values such as `EN`, while most ProductSearch endpoints use lowercase values such as `en`.

Pass `timeoutMs` on the client or on an individual request to abort slow OAuth and API requests. If an API call needs to fetch or refresh an OAuth token first, that token request receives the same `signal` and `timeoutMs`.

Failed HTTP responses throw `DigiKeyApiError`. Transport failures before a response is received, including timeouts and caller aborts, throw `DigiKeyNetworkError`.

Digi-Key documents rate-limit headers on API responses. Use `onResponse` to capture parsed quota metadata:

```ts
const client = new DigiKeyClient({
  clientId: process.env.DIGIKEY_CLIENT_ID!,
  clientSecret: process.env.DIGIKEY_CLIENT_SECRET!,
  accountId: process.env.DIGIKEY_ACCOUNT_ID,
  onResponse: ({ status, rateLimit }) => {
    console.log(status, rateLimit.remaining, rateLimit.retryAfter);
  }
});
```

## OAuth authorization code flow

```ts
import { DigiKeyAuthClient, DigiKeyClient } from "digihoo";

const auth = new DigiKeyAuthClient({
  clientId: process.env.DIGIKEY_CLIENT_ID!,
  clientSecret: process.env.DIGIKEY_CLIENT_SECRET!,
  environment: "production"
});

const url = auth.buildAuthorizationUrl({
  redirectUri: "https://example.com/oauth/callback",
  state: "opaque-csrf-token"
});

// Send the user to url, then exchange the returned code on your server.
const token = await auth.exchangeAuthorizationCode({
  code: "authorization-code",
  redirectUri: "https://example.com/oauth/callback"
});

const client = new DigiKeyClient({
  clientId: process.env.DIGIKEY_CLIENT_ID!,
  accessToken: token.access_token,
  oauthFlow: "authorizationCode"
});

const pcn = await client.productChangeNotifications.productChangeNotifications("296-6501-1-ND");
```

Digi-Key regenerates refresh tokens when they are used. Persist the latest token returned by the SDK:

```ts
import { DigiKeyClient, DigiKeyAuthClient, DigiKeyRefreshTokenProvider } from "digihoo";

const auth = new DigiKeyAuthClient({
  clientId: process.env.DIGIKEY_CLIENT_ID!,
  clientSecret: process.env.DIGIKEY_CLIENT_SECRET!
});

const tokenProvider = new DigiKeyRefreshTokenProvider({
  authClient: auth,
  refreshToken: storedRefreshToken,
  onToken: async (token) => {
    if (token.refresh_token) {
      await saveRefreshToken(token.refresh_token);
    }
  }
});

const client = new DigiKeyClient({
  clientId: process.env.DIGIKEY_CLIENT_ID!,
  tokenProvider
});
```

Never expose a Digi-Key client secret in browser code. Use the SDK from a trusted server process for OAuth token exchange and client-credentials calls.

## ProductSearch methods

```ts
await client.productSearch.keywordSearch({ Keywords: "microcontroller", Limit: 10 });
await client.productSearch.productDetails("296-6501-1-ND");
await client.productSearch.manufacturers();
await client.productSearch.categories();
await client.productSearch.categoryById(32);
await client.productSearch.digiReelPricing("296-6501-1-ND", 100);
await client.productSearch.recommendedProducts("296-6501-1-ND", { limit: 5 });
await client.productSearch.substitutions("296-6501-1-ND");
await client.productSearch.associations("296-6501-1-ND");
await client.productSearch.packageTypeByQuantity("296-6501-1-ND", 100, { packagingPreference: "DKR" }); // Deprecated by Digi-Key; use pricingOptionsByQuantity.
await client.productSearch.media("296-6501-1-ND");
await client.productSearch.productPricing("296-6501-1-ND", { limit: 5, inStock: true, locale: { language: "EN" } });
await client.productSearch.alternatePackaging("296-6501-1-ND");
await client.productSearch.pricingOptionsByQuantity("296-6501-1-ND", 100);
```

## Product Change Notifications methods

```ts
await client.productChangeNotifications.productChangeNotifications("296-6501-1-ND", {
  Includes: "ProductChangeNotifications(PcnType,PcnDescription)",
  locale: {
    shipToCountry: "US"
  }
});
```

The SDK exports generated request and response types from Digi-Key's Swagger definitions through the method-specific type aliases in `product-search` and `product-change-notifications`.

## Development

```sh
npm install
npm run generate:types
npm run verify
```

`npm install` configures the tracked Git commit hook that validates commit messages with hooversion before Git accepts them.

`npm run check` runs type checking, unit tests with V8 coverage thresholds, and the package build. Coverage includes runtime source files and excludes generated OpenAPI types, type-only modules, and barrel exports.

`npm run generate:types` refreshes the generated TypeScript schema types from Digi-Key's official Swagger downloads.

## Credits

This SDK is built from Digi-Key's public API documentation and Swagger definitions. Digi-Key product names, API names, and documentation are owned by Digi-Key and their respective owners.

The generated TypeScript schema types are produced with `openapi-typescript` after converting Digi-Key's Swagger definitions with `swagger2openapi`.

This project is not affiliated with, endorsed by, or sponsored by Digi-Key.

## License

MIT. See [LICENSE](LICENSE).
