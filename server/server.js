const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const createRecommendationRoutes = require("./routes/recommendations");

function loadEnvFile() {
    const envPath = path.join(__dirname, ".env");
    if (!fs.existsSync(envPath)) return;

    fs.readFileSync(envPath, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .forEach((line) => {
            const separatorIndex = line.indexOf("=");
            if (separatorIndex === -1) return;

            const key = line.slice(0, separatorIndex).trim();
            const value = line.slice(separatorIndex + 1).trim();

            if (key && process.env[key] === undefined) {
                process.env[key] = value;
            }
        });
}

loadEnvFile();

const app = express();
const port = Number(process.env.PORT) || 3000;
const DATASET_PATH = path.join(
    __dirname,
    "..",
    "cars_model",
    "car_ads_details_kaggle.csv",
);
const CLIENT_PATH = path.join(__dirname, "..", "client");
const CURRENT_YEAR = new Date().getFullYear();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

function parseCsvRow(row) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < row.length; i += 1) {
        const char = row[i];

        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    values.push(current.trim());
    return values;
}

function toNumber(value) {
    if (value === null || value === undefined) return null;
    const cleaned = String(value).replace(/[^\d.-]/g, "");
    if (!cleaned) return null;

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
}

function parsePrice(price) {
    if (!price) return 0;

    const parsed = Number(
        price.toString().replace("EGP", "").replace(/,/g, "").trim(),
    );

    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value) {
    return String(value || "").trim();
}

function parseVehicleRecord(raw) {
    const price = parsePrice(raw["Price_EGP"]);
    const year = toNumber(raw["Year"]) ?? 0;
    const kilometers = toNumber(raw["Kilometers"]) ?? 0;
    const engineCapacityCc = toNumber(raw["Engine Capacity (CC)"]) ?? 0;
    const age = Number.isFinite(year) ? Math.max(0, CURRENT_YEAR - year) : null;

    return {
        brand: normalizeText(raw.Brand),
        model: normalizeText(raw.Model),
        kilometers,
        year,
        fuelType: normalizeText(raw["Fuel Type"]),
        transmissionType: normalizeText(raw["Transmission Type"]),
        engineCapacityCc,
        bodyType: normalizeText(raw["Body Type"]),
        priceEgp: price,
        carAge: age,
    };
}

function readDataset() {
    const csvContent = fs.readFileSync(DATASET_PATH, "utf8");
    const lines = csvContent
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 2) return [];

    const headers = parseCsvRow(lines[0]);
    const records = [];

    for (let i = 1; i < lines.length; i += 1) {
        const values = parseCsvRow(lines[i]);
        if (values.length !== headers.length) continue;

        const rawRecord = {};
        headers.forEach((header, index) => {
            rawRecord[header] = values[index];
        });

        const parsed = parseVehicleRecord(rawRecord);
        if (!Number.isFinite(parsed.priceEgp)) continue;
        records.push(parsed);
    }

    return records;
}

const vehicles = readDataset();

function uniqueSorted(records, key) {
    return [
        ...new Set(records.map((record) => record[key]).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));
}

function numberRange(records, key) {
    const values = records
        .map((record) => record[key])
        .filter((value) => Number.isFinite(value));
    if (values.length === 0) {
        return { min: null, max: null };
    }

    return {
        min: Math.min(...values),
        max: Math.max(...values),
    };
}

function safeDivide(a, b) {
    return b === 0 ? 0 : a / b;
}

function similarityScore(target, candidate) {
    let score = 0;

    if (target.brand && candidate.brand) {
        score +=
            target.brand.toLowerCase() === candidate.brand.toLowerCase()
                ? 30
                : 0;
    }

    if (target.model && candidate.model) {
        score +=
            target.model.toLowerCase() === candidate.model.toLowerCase()
                ? 25
                : 0;
    }

    if (target.fuelType && candidate.fuelType) {
        score +=
            target.fuelType.toLowerCase() === candidate.fuelType.toLowerCase()
                ? 8
                : 0;
    }

    if (target.transmissionType && candidate.transmissionType) {
        score +=
            target.transmissionType.toLowerCase() ===
            candidate.transmissionType.toLowerCase()
                ? 8
                : 0;
    }

    if (target.bodyType && candidate.bodyType) {
        score +=
            target.bodyType.toLowerCase() === candidate.bodyType.toLowerCase()
                ? 8
                : 0;
    }

    if (Number.isFinite(target.year) && Number.isFinite(candidate.year)) {
        const yearDiff = Math.abs(target.year - candidate.year);
        score += Math.max(0, 10 - yearDiff);
    }

    if (
        Number.isFinite(target.kilometers) &&
        Number.isFinite(candidate.kilometers)
    ) {
        const kmDiffRatio = safeDivide(
            Math.abs(target.kilometers - candidate.kilometers),
            50000,
        );
        score += Math.max(0, 7 - kmDiffRatio);
    }

    if (
        Number.isFinite(target.engineCapacityCc) &&
        Number.isFinite(candidate.engineCapacityCc)
    ) {
        const engineDiffRatio = safeDivide(
            Math.abs(target.engineCapacityCc - candidate.engineCapacityCc),
            300,
        );
        score += Math.max(0, 4 - engineDiffRatio);
    }

    return score;
}

function weightedAverage(values) {
    let numerator = 0;
    let denominator = 0;

    values.forEach(({ value, weight }) => {
        numerator += value * weight;
        denominator += weight;
    });

    return denominator > 0 ? numerator / denominator : null;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function determineMarketPosition(estimatedPrice, referenceMedian) {
    if (!Number.isFinite(referenceMedian) || referenceMedian <= 0)
        return "fair";

    const ratio = estimatedPrice / referenceMedian;

    if (ratio < 0.9) return "good-deal";
    if (ratio > 1.1) return "overpriced";
    return "fair";
}

function validatePredictionPayload(payload) {
    const errors = [];
    const normalized = {
        brand: normalizeText(payload.brand),
        model: normalizeText(payload.model),
        year: toNumber(payload.year),
        kilometers: toNumber(payload.kilometers),
        fuelType: normalizeText(payload.fuelType),
        transmissionType: normalizeText(payload.transmissionType),
        engineCapacityCc: toNumber(payload.engineCapacityCc),
        bodyType: normalizeText(payload.bodyType),
    };

    if (!normalized.brand) errors.push("brand is required");
    if (!normalized.model) errors.push("model is required");

    if (
        !Number.isFinite(normalized.year) ||
        normalized.year < 1950 ||
        normalized.year > CURRENT_YEAR + 1
    ) {
        errors.push(
            `year must be a valid number between 1950 and ${CURRENT_YEAR + 1}`,
        );
    }

    if (!Number.isFinite(normalized.kilometers) || normalized.kilometers < 0) {
        errors.push("kilometers must be a non-negative number");
    }

    if (!normalized.fuelType) errors.push("fuelType is required");
    if (!normalized.transmissionType)
        errors.push("transmissionType is required");

    if (
        !Number.isFinite(normalized.engineCapacityCc) ||
        normalized.engineCapacityCc <= 0
    ) {
        errors.push("engineCapacityCc must be a positive number");
    }

    if (!normalized.bodyType) errors.push("bodyType is required");

    return { errors, normalized };
}

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        datasetSize: vehicles.length,
        timestamp: new Date().toISOString(),
    });
});

app.get("/api/meta/options", (req, res) => {
    const priceRange = numberRange(vehicles, "priceEgp");
    const years = numberRange(vehicles, "year");
    const mileage = numberRange(vehicles, "kilometers");
    const engineCapacity = numberRange(vehicles, "engineCapacityCc");

    res.json({
        brands: uniqueSorted(vehicles, "brand"),
        models: uniqueSorted(vehicles, "model"),
        fuelTypes: uniqueSorted(vehicles, "fuelType"),
        transmissionTypes: uniqueSorted(vehicles, "transmissionType"),
        bodyTypes: uniqueSorted(vehicles, "bodyType"),
        ranges: {
            year: years,
            kilometers: mileage,
            engineCapacityCc: engineCapacity,
            priceEgp: priceRange,
        },
    });
});

app.get("/api/meta/models", (req, res) => {
    const brand = normalizeText(req.query.brand);
    if (!brand) {
        return res
            .status(400)
            .json({ error: "brand query parameter is required" });
    }

    const models = uniqueSorted(
        vehicles.filter((v) => v.brand.toLowerCase() === brand.toLowerCase()),
        "model",
    );

    return res.json({ brand, models });
});

app.post("/api/valuation/predict", (req, res) => {
    const { errors, normalized } = validatePredictionPayload(req.body || {});

    if (errors.length > 0) {
        return res
            .status(400)
            .json({ error: "Validation failed", details: errors });
    }

    let candidates = vehicles.filter(
        (v) =>
            v.brand.toLowerCase() === normalized.brand.toLowerCase() &&
            v.model.toLowerCase() === normalized.model.toLowerCase(),
    );

    if (candidates.length < 10) {
        candidates = vehicles.filter(
            (v) => v.brand.toLowerCase() === normalized.brand.toLowerCase(),
        );
    }

    if (candidates.length < 10) {
        candidates = vehicles;
    }

    const scored = candidates
        .map((candidate) => ({
            ...candidate,
            similarity: similarityScore(normalized, candidate),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 50);

    const withWeights = scored.map((item) => ({
        value: item.priceEgp,
        weight: Math.max(item.similarity, 1),
    }));

    const estimatedPrice = weightedAverage(withWeights);
    const sortedPrices = scored
        .map((item) => item.priceEgp)
        .sort((a, b) => a - b);
    const medianPrice =
        sortedPrices.length > 0
            ? sortedPrices[Math.floor(sortedPrices.length / 2)]
            : null;

    const confidence = clamp((scored.length / 50) * 100, 20, 98);

    if (!Number.isFinite(estimatedPrice)) {
        return res.status(500).json({
            error: "Unable to estimate price for the provided vehicle",
        });
    }

    return res.json({
        input: normalized,
        estimatedPriceEgp: Math.round(estimatedPrice),
        confidence: Math.round(confidence),
        marketPosition: determineMarketPosition(estimatedPrice, medianPrice),
        comparablesUsed: scored.length,
        sampleComparables: scored.slice(0, 5),
    });
});

// Generate car images - 2 to 6 images per car
function generateCarImages(brand, model, index) {
    const imageCount = Math.floor(Math.random() * 5) + 2; // 2-6 images
    const images = [];
    const seed = `${brand}-${model}-${index}`;

    // Generate consistent but varied image IDs based on car info
    const baseId = seed.charCodeAt(0) + index;

    for (let i = 0; i < imageCount; i += 1) {
        // Using unsplash API for better reliability and car-related images
        const imageId = (baseId + i) % 100;
        // Unsplash API with specific search term for cars
        const imageUrl = `https://source.unsplash.com/400x300/?car,vehicle,${imageId}`;
        images.push(imageUrl);
    }

    return images;
}

function handleRecommendations(req, res) {
    const minPrice = toNumber(req.query.minPrice) ?? 0;
    const maxPrice = toNumber(req.query.maxPrice) ?? Number.MAX_SAFE_INTEGER;
    const limit = clamp(toNumber(req.query.limit) || 10, 1, 100);
    const brand = normalizeText(req.query.brand).toLowerCase();
    const fuelType = normalizeText(req.query.fuelType).toLowerCase();
    const bodyType = normalizeText(req.query.bodyType).toLowerCase();

    if (minPrice > maxPrice) {
        return res
            .status(400)
            .json({ error: "minPrice cannot be greater than maxPrice" });
    }

    const baseFiltered = vehicles
        .filter((v) => v.priceEgp >= minPrice && v.priceEgp <= maxPrice)
        .filter((v) => (!brand ? true : v.brand.toLowerCase() === brand))
        .filter((v) =>
            !fuelType ? true : v.fuelType.toLowerCase() === fuelType,
        )
        .filter((v) =>
            !bodyType ? true : v.bodyType.toLowerCase() === bodyType,
        );

    let candidatePool = [...baseFiltered];

    // If we do not have enough cars at or below maxPrice, add closest cars above maxPrice.
    if (candidatePool.length < limit) {
        const aboveMax = vehicles
            .filter((v) => v.priceEgp > maxPrice)
            .filter((v) => (!brand ? true : v.brand.toLowerCase() === brand))
            .filter((v) =>
                !fuelType ? true : v.fuelType.toLowerCase() === fuelType,
            )
            .filter((v) =>
                !bodyType ? true : v.bodyType.toLowerCase() === bodyType,
            );

        candidatePool = [...candidatePool, ...aboveMax];
    }

    // If still empty, fall back to closest cars from the full dataset.
    if (candidatePool.length === 0) {
        candidatePool = [...vehicles];
    }

    const sortedByCloseness = candidatePool
        .map((car) => ({
            ...car,
            distanceFromMaxPrice: Math.abs(maxPrice - car.priceEgp),
        }))
        .sort((a, b) => {
            if (a.distanceFromMaxPrice === b.distanceFromMaxPrice) {
                return a.priceEgp - b.priceEgp;
            }

            return a.distanceFromMaxPrice - b.distanceFromMaxPrice;
        });

    const recommendations = sortedByCloseness
        .slice(0, limit)
        .map((car, index) => ({
            ...car,
            images: generateCarImages(car.brand, car.model, index),
            thumbnail: `https://source.unsplash.com/80x80/?car,vehicle,${(car.brand.charCodeAt(0) + index) % 50}`,
        }));

    return res.json({
        count: recommendations.length,
        recommendations,
    });
}

function handleStatistics(req, res) {
    const engineStats = {};
    const transmissionStats = {};
    const brandStats = {};

    vehicles.forEach((car) => {
        const fuelType = normalizeText(car.fuelType) || "Unknown";
        const transmissionType =
            normalizeText(car.transmissionType) || "Unknown";
        const brand = normalizeText(car.brand) || "Unknown";

        engineStats[fuelType] = (engineStats[fuelType] || 0) + 1;
        transmissionStats[transmissionType] =
            (transmissionStats[transmissionType] || 0) + 1;
        brandStats[brand] = (brandStats[brand] || 0) + 1;
    });

    return res.json({
        engineStats,
        transmissionStats,
        brandStats,
        total: vehicles.length,
    });
}

app.use(
    createRecommendationRoutes({
        handleRecommendations,
        handleStatistics,
    }),
);

app.post("/api/contact", (req, res) => {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing fields" });
    }

    return res.json({ success: true });
});

app.use(express.static(CLIENT_PATH));

app.get("/", (req, res) => {
    res.sendFile(path.join(CLIENT_PATH, "index.html"));
});

app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
    console.log(`Vehicle Valuation API running on http://localhost:${port}`);
});
