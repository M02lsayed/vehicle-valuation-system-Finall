const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "/api";

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorMessage = data.error || data.message || "API request failed";
        const details = Array.isArray(data.details)
            ? `: ${data.details.join(", ")}`
            : "";
        throw new Error(`${errorMessage}${details}`);
    }

    return data;
}

export function getVehicleOptions() {
    return request("/meta/options");
}

export function getModelsByBrand(brand) {
    return request(`/meta/models?brand=${encodeURIComponent(brand)}`);
}

export function predictVehiclePrice(data) {
    return request("/valuation/predict", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function getRecommendations(params = {}) {
    const query = new URLSearchParams({
        minPrice: String(params.minPrice ?? 0),
        maxPrice: String(params.maxPrice ?? Number.MAX_SAFE_INTEGER),
        limit: String(params.limit ?? 20),
        brand: String(params.brand ?? ""),
        fuelType: String(params.fuelType ?? ""),
        bodyType: String(params.bodyType ?? ""),
    });

    return request(`/recommendations?${query.toString()}`);
}

export function getStatistics() {
    return request("/statistics");
}

export function submitContact(data) {
    return request("/contact", {
        method: "POST",
        body: JSON.stringify({
            name: String(data.name || "").trim(),
            email: String(data.email || "").trim(),
            message: String(data.message || "").trim(),
        }),
    });
}
