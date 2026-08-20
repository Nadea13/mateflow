export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "SGD" | "AUD" | "CAD" | "CNY" | "THB";

export interface CurrencyConfig {
    code: CurrencyCode;
    symbol: string;
    name: string;
    decimalDigits: number;
    symbolPosition: "prefix" | "suffix";
    exchangeRateToBaseUSD: number;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
    USD: {
        code: "USD",
        symbol: "$",
        name: "US Dollar",
        decimalDigits: 2,
        symbolPosition: "prefix",
        exchangeRateToBaseUSD: 1.0,
    },
    EUR: {
        code: "EUR",
        symbol: "€",
        name: "Euro",
        decimalDigits: 2,
        symbolPosition: "prefix",
        exchangeRateToBaseUSD: 0.92,
    },
    GBP: {
        code: "GBP",
        symbol: "£",
        name: "British Pound",
        decimalDigits: 2,
        symbolPosition: "prefix",
        exchangeRateToBaseUSD: 0.79,
    },
    JPY: {
        code: "JPY",
        symbol: "¥",
        name: "Japanese Yen",
        decimalDigits: 0,
        symbolPosition: "prefix",
        exchangeRateToBaseUSD: 155.0,
    },
    SGD: {
        code: "SGD",
        symbol: "S$",
        name: "Singapore Dollar",
        decimalDigits: 2,
        symbolPosition: "prefix",
        exchangeRateToBaseUSD: 1.34,
    },
    AUD: {
        code: "AUD",
        symbol: "A$",
        name: "Australian Dollar",
        decimalDigits: 2,
        symbolPosition: "prefix",
        exchangeRateToBaseUSD: 1.52,
    },
    CAD: {
        code: "CAD",
        symbol: "C$",
        name: "Canadian Dollar",
        decimalDigits: 2,
        symbolPosition: "prefix",
        exchangeRateToBaseUSD: 1.36,
    },
    CNY: {
        code: "CNY",
        symbol: "¥",
        name: "Chinese Yuan",
        decimalDigits: 2,
        symbolPosition: "prefix",
        exchangeRateToBaseUSD: 7.23,
    },
    THB: {
        code: "THB",
        symbol: "฿",
        name: "Thai Baht",
        decimalDigits: 2,
        symbolPosition: "prefix",
        exchangeRateToBaseUSD: 36.5,
    },
};

export function formatMoney(
    amount: number | null | undefined,
    currencyCode: CurrencyCode = "USD",
    locale: string = "en-US"
): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
        amount = 0;
    }

    const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;

    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: config.code,
            minimumFractionDigits: config.decimalDigits,
            maximumFractionDigits: config.decimalDigits,
        }).format(amount);
    } catch {
        const formattedNum = Number(amount).toLocaleString(undefined, {
            minimumFractionDigits: config.decimalDigits,
            maximumFractionDigits: config.decimalDigits,
        });
        return config.symbolPosition === "prefix"
            ? `${config.symbol}${formattedNum}`
            : `${formattedNum} ${config.symbol}`;
    }
}
