import type { DigiKeyResponseMetadata } from "./response-metadata";

export type MaybePromise<T> = T | Promise<T>;

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export interface TokenRequestContext {
  forceRefresh?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface TokenProvider {
  readonly oauthFlow?: DigiKeyOAuthFlow;
  getAccessToken(options?: TokenRequestContext): MaybePromise<string>;
}

export type ResponseHook = (metadata: DigiKeyResponseMetadata) => MaybePromise<void>;

export type DigiKeyOAuthFlow = "clientCredentials" | "authorizationCode" | "unknown";

export type DigiKeyLocaleSite =
  | "US"
  | "CA"
  | "JP"
  | "UK"
  | "DE"
  | "AT"
  | "BE"
  | "DK"
  | "FI"
  | "GR"
  | "IE"
  | "IT"
  | "LU"
  | "NL"
  | "NO"
  | "PT"
  | "ES"
  | "KR"
  | "HK"
  | "SG"
  | "CN"
  | "TW"
  | "AU"
  | "FR"
  | "IN"
  | "NZ"
  | "SE"
  | "MX"
  | "CH"
  | "IL"
  | "PL"
  | "SK"
  | "SI"
  | "LV"
  | "LT"
  | "EE"
  | "CZ"
  | "HU"
  | "BG"
  | "MY"
  | "ZA"
  | "RO"
  | "TH"
  | "PH"
  | "BR"
  | "VN";

export type DigiKeyProductSearchLocaleLanguage =
  | "en"
  | "ja"
  | "de"
  | "fr"
  | "ko"
  | "zhs"
  | "zht"
  | "it"
  | "es"
  | "he"
  | "nl"
  | "sv"
  | "pl"
  | "fi"
  | "da"
  | "no";

export type DigiKeyProductPricingLocaleLanguage =
  | "CS"
  | "DA"
  | "DE"
  | "EN"
  | "ES"
  | "FI"
  | "FR"
  | "HE"
  | "HU"
  | "IT"
  | "JA"
  | "KO"
  | "NL"
  | "NO"
  | "PL"
  | "PT"
  | "RO"
  | "SV"
  | "TH"
  | "ZHS"
  | "ZHT";

export type DigiKeyLocaleLanguage =
  | DigiKeyProductSearchLocaleLanguage
  | DigiKeyProductPricingLocaleLanguage;

export type DigiKeyLocaleCurrency =
  | "USD"
  | "CAD"
  | "JPY"
  | "GBP"
  | "EUR"
  | "HKD"
  | "SGD"
  | "TWD"
  | "KRW"
  | "AUD"
  | "NZD"
  | "INR"
  | "DKK"
  | "NOK"
  | "SEK"
  | "ILS"
  | "CNY"
  | "PLN"
  | "CHF"
  | "CZK"
  | "HUF"
  | "RON"
  | "ZAR"
  | "MYR"
  | "THB"
  | "PHP";

export type DigiKeyLocaleShipToCountry =
  | "AD"
  | "AE"
  | "AF"
  | "AG"
  | "AI"
  | "AL"
  | "AM"
  | "AO"
  | "AQ"
  | "AR"
  | "AS"
  | "AT"
  | "AU"
  | "AW"
  | "AX"
  | "AZ"
  | "BA"
  | "BB"
  | "BD"
  | "BE"
  | "BF"
  | "BG"
  | "BH"
  | "BI"
  | "BJ"
  | "BL"
  | "BM"
  | "BN"
  | "BO"
  | "BQ"
  | "BR"
  | "BS"
  | "BT"
  | "BV"
  | "BW"
  | "BY"
  | "BZ"
  | "CA"
  | "CC"
  | "CD"
  | "CF"
  | "CG"
  | "CH"
  | "CI"
  | "CK"
  | "CL"
  | "CM"
  | "CN"
  | "CO"
  | "CR"
  | "CU"
  | "CV"
  | "CW"
  | "CX"
  | "CY"
  | "CZ"
  | "DE"
  | "DJ"
  | "DK"
  | "DM"
  | "DO"
  | "DZ"
  | "EC"
  | "EE"
  | "EG"
  | "EH"
  | "ER"
  | "ES"
  | "ET"
  | "FI"
  | "FJ"
  | "FK"
  | "FM"
  | "FO"
  | "FR"
  | "GA"
  | "GB"
  | "GD"
  | "GE"
  | "GF"
  | "GG"
  | "GH"
  | "GI"
  | "GL"
  | "GM"
  | "GN"
  | "GP"
  | "GQ"
  | "GR"
  | "GS"
  | "GT"
  | "GU"
  | "GW"
  | "GY"
  | "HK"
  | "HM"
  | "HN"
  | "HR"
  | "HT"
  | "HU"
  | "ID"
  | "IE"
  | "IL"
  | "IM"
  | "IN"
  | "IO"
  | "IQ"
  | "IR"
  | "IS"
  | "IT"
  | "JE"
  | "JM"
  | "JO"
  | "JP"
  | "KE"
  | "KG"
  | "KH"
  | "KI"
  | "KM"
  | "KN"
  | "KP"
  | "KR"
  | "KW"
  | "KY"
  | "KZ"
  | "LA"
  | "LB"
  | "LC"
  | "LI"
  | "LK"
  | "LR"
  | "LS"
  | "LT"
  | "LU"
  | "LV"
  | "LY"
  | "MA"
  | "MC"
  | "MD"
  | "ME"
  | "MF"
  | "MG"
  | "MH"
  | "MK"
  | "ML"
  | "MM"
  | "MN"
  | "MO"
  | "MP"
  | "MQ"
  | "MR"
  | "MS"
  | "MT"
  | "MU"
  | "MV"
  | "MW"
  | "MX"
  | "MY"
  | "MZ"
  | "NA"
  | "NC"
  | "NE"
  | "NF"
  | "NG"
  | "NI"
  | "NL"
  | "NO"
  | "NP"
  | "NR"
  | "NU"
  | "NZ"
  | "OM"
  | "PA"
  | "PE"
  | "PF"
  | "PG"
  | "PH"
  | "PK"
  | "PL"
  | "PM"
  | "PN"
  | "PR"
  | "PS"
  | "PT"
  | "PW"
  | "PY"
  | "QA"
  | "RE"
  | "RO"
  | "RS"
  | "RU"
  | "RW"
  | "SA"
  | "SB"
  | "SC"
  | "SD"
  | "SE"
  | "SG"
  | "SH"
  | "SI"
  | "SJ"
  | "SK"
  | "SL"
  | "SM"
  | "SN"
  | "SO"
  | "SR"
  | "SS"
  | "ST"
  | "SV"
  | "SX"
  | "SY"
  | "SZ"
  | "TC"
  | "TD"
  | "TF"
  | "TG"
  | "TH"
  | "TJ"
  | "TK"
  | "TL"
  | "TM"
  | "TN"
  | "TO"
  | "TR"
  | "TT"
  | "TV"
  | "TW"
  | "TZ"
  | "UA"
  | "UG"
  | "UM"
  | "US"
  | "UY"
  | "UZ"
  | "VA"
  | "VC"
  | "VE"
  | "VG"
  | "VI"
  | "VN"
  | "VU"
  | "WF"
  | "WS"
  | "YE"
  | "YT"
  | "ZA"
  | "ZM"
  | "ZW";

export type DigiKeyProductPricingLocaleSite = Exclude<DigiKeyLocaleSite, "VN">;
export type DigiKeyProductChangeNotificationsLocaleSite = Exclude<DigiKeyLocaleSite, "BR" | "VN">;

export interface DigiKeyLocale<
  Site extends DigiKeyLocaleSite = DigiKeyLocaleSite,
  Language extends DigiKeyLocaleLanguage = DigiKeyLocaleLanguage,
  Currency extends DigiKeyLocaleCurrency = DigiKeyLocaleCurrency,
  ShipToCountry extends DigiKeyLocaleShipToCountry = DigiKeyLocaleShipToCountry
> {
  site?: Site;
  language?: Language;
  currency?: Currency;
  shipToCountry?: ShipToCountry;
}

export type DigiKeyProductSearchLocale = DigiKeyLocale<
  DigiKeyLocaleSite,
  DigiKeyProductSearchLocaleLanguage,
  DigiKeyLocaleCurrency,
  never
>;

export type DigiKeyProductPricingLocale = DigiKeyLocale<
  DigiKeyProductPricingLocaleSite,
  DigiKeyProductPricingLocaleLanguage,
  DigiKeyLocaleCurrency,
  never
>;

export type DigiKeyProductChangeNotificationsLocale = DigiKeyLocale<
  DigiKeyProductChangeNotificationsLocaleSite,
  DigiKeyProductSearchLocaleLanguage,
  DigiKeyLocaleCurrency,
  DigiKeyLocaleShipToCountry
>;

export interface DigiKeyRequestOptions<Locale extends DigiKeyLocale = DigiKeyLocale> {
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: HeadersInit;
  locale?: Locale;
  accountId?: string;
  retryOnUnauthorized?: boolean;
}

export type JsonResponse<Operation, Status extends number = 200> =
  Operation extends {
    responses: {
      [Key in Status]: {
        content: {
          "application/json": infer Body;
        };
      };
    };
  }
    ? Body
    : never;

export type OperationQuery<Operation> = Operation extends {
  parameters: {
    query?: infer Query;
  };
}
  ? [Query] extends [never]
    ? Record<string, never>
    : NonNullable<Query>
  : Record<string, never>;

export type OperationRequestBody<Operation> = Operation extends {
  requestBody?: {
    content: {
      "application/json": infer Body;
    };
  };
}
  ? Body
  : never;
