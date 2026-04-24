export function formatPrice(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return "0";

    return numericValue.toLocaleString();
}

export function formatPriceShort(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return "0";

    if (numericValue >= 1000000) {
        return `${(numericValue / 1000000).toFixed(1)}M`;
    }

    if (numericValue >= 1000) {
        return `${(numericValue / 1000).toFixed(0)}K`;
    }

    return String(numericValue);
}
