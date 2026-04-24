# Vehicle Valuation Backend API

This backend serves the Vehicle Valuation project API and can also serve the static `client` app.

## Base URL

- Local: `http://localhost:3000`

## Start Server

From the `server` folder:

```bash
npm start
```

## Content Type

- Request body format: `application/json` for POST endpoints.
- Response format: JSON.

---

## API Contract

### 1) Health Check

- **Method:** `GET`
- **Path:** `/api/health`
- **Purpose:** Quick backend status and dataset load check.

**Success Response (200)**

```json
{
  "status": "ok",
  "datasetSize": 8374,
  "timestamp": "2026-04-20T14:48:30.335Z"
}
```

---

### 2) Metadata Options (dropdown data)

- **Method:** `GET`
- **Path:** `/api/meta/options`
- **Purpose:** Populate client dropdowns and ranges.

**Success Response (200)**

```json
{
  "brands": ["BMW", "Toyota"],
  "models": ["320", "Corolla"],
  "fuelTypes": ["Benzine", "Diesel"],
  "transmissionTypes": ["Automatic", "Manual"],
  "bodyTypes": ["Sedan", "SUV"],
  "ranges": {
    "year": { "min": 1976, "max": 2025 },
    "kilometers": { "min": 1, "max": 1000000 },
    "engineCapacityCc": { "min": 650, "max": 6200 },
    "priceEgp": { "min": 70000, "max": 15000000 }
  }
}
```

---

### 3) Models By Brand

- **Method:** `GET`
- **Path:** `/api/meta/models`
- **Query params:**
  - `brand` (required, string)
- **Purpose:** Load model options after selecting a brand.

**Example**

`GET /api/meta/models?brand=Toyota`

**Success Response (200)**

```json
{
  "brand": "Toyota",
  "models": ["Camry", "Corolla", "Yaris"]
}
```

**Error Response (400)**

```json
{
  "error": "brand query parameter is required"
}
```

---

### 4) Price Prediction

- **Method:** `POST`
- **Path:** `/api/valuation/predict`
- **Purpose:** Estimate vehicle market value from input details.

**Request Body**

```json
{
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "kilometers": 70000,
  "fuelType": "Benzine",
  "transmissionType": "Automatic",
  "engineCapacityCc": 1600,
  "bodyType": "Sedan"
}
```

**Field Rules**

- `brand`: required string
- `model`: required string
- `year`: required number, must be between `1950` and `currentYear + 1`
- `kilometers`: required number, must be `>= 0`
- `fuelType`: required string
- `transmissionType`: required string
- `engineCapacityCc`: required number, must be `> 0`
- `bodyType`: required string

**Success Response (200)**

```json
{
  "input": {
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "kilometers": 70000,
    "fuelType": "Benzine",
    "transmissionType": "Automatic",
    "engineCapacityCc": 1600,
    "bodyType": "Sedan"
  },
  "estimatedPriceEgp": 1010020,
  "confidence": 98,
  "marketPosition": "fair",
  "comparablesUsed": 50,
  "sampleComparables": [
    {
      "brand": "Toyota",
      "model": "Corolla",
      "kilometers": 75000,
      "year": 2020,
      "fuelType": "Benzine",
      "transmissionType": "Automatic",
      "engineCapacityCc": 1600,
      "bodyType": "Sedan",
      "priceEgp": 1010000,
      "carAge": 6,
      "similarity": 99.9
    }
  ]
}
```

**Validation Error Response (400)**

```json
{
  "error": "Validation failed",
  "details": [
    "brand is required",
    "kilometers must be a non-negative number"
  ]
}
```

---

### 5) Recommendations

- **Method:** `GET`
- **Path:** `/api/recommendations`
- **Query params:**
  - `minPrice` (optional, number, default `0`)
  - `maxPrice` (optional, number, default max safe integer)
  - `limit` (optional, number, default `20`, min `1`, max `100`)
  - `brand` (optional, string)
  - `fuelType` (optional, string)
  - `bodyType` (optional, string)
- **Purpose:** Return filtered list of vehicles for recommended cars table.

**Example**

`GET /api/recommendations?minPrice=500000&maxPrice=700000&limit=5`

**Success Response (200)**

```json
{
  "filters": {
    "minPrice": 500000,
    "maxPrice": 700000,
    "limit": 5,
    "brand": "",
    "fuelType": "",
    "bodyType": ""
  },
  "count": 5,
  "recommendations": [
    {
      "brand": "Seat",
      "model": "Ibiza",
      "kilometers": 230000,
      "year": 2014,
      "fuelType": "Benzine",
      "transmissionType": "Automatic",
      "engineCapacityCc": 1600,
      "bodyType": "Hatchback",
      "priceEgp": 500000,
      "carAge": 12
    }
  ]
}
```

**Error Response (400)**

```json
{
  "error": "minPrice cannot be greater than maxPrice"
}
```

---

### 6) Statistics

- **Method:** `GET`
- **Path:** `/api/statistics`
- **Query params:**
  - `minPrice` (optional, number)
  - `maxPrice` (optional, number)
- **Purpose:** Return analytics data for charts/summary blocks.

**Example**

`GET /api/statistics?minPrice=300000&maxPrice=1200000`

**Success Response (200)**

```json
{
  "count": 1200,
  "distributions": {
    "fuelTypes": { "Benzine": 900, "Diesel": 300 },
    "transmissionTypes": { "Automatic": 700, "Manual": 500 },
    "brands": { "Toyota": 200, "BMW": 120 }
  },
  "ranges": {
    "priceEgp": {
      "min": 300000,
      "max": 1200000,
      "average": 740000
    },
    "year": {
      "min": 1998,
      "max": 2025
    }
  }
}
```

If no cars match, response returns:

```json
{
  "count": 0,
  "message": "No vehicles found for the provided criteria",
  "distributions": {
    "fuelTypes": {},
    "transmissionTypes": {},
    "brands": {}
  },
  "ranges": {
    "priceEgp": { "min": null, "max": null, "average": null },
    "year": { "min": null, "max": null }
  }
}
```

---

## Static Client Routes

- `GET /` serves `client/index.html`.
- Unknown routes return:

```json
{
  "error": "Route not found"
}
```

## Frontend Integration Notes

- Use `/api/meta/options` on page load to fill dropdowns.
- On brand selection, call `/api/meta/models?brand=<brand>`.
- On form submit, call `POST /api/valuation/predict`.
- On recommended page slider/filter changes, call `/api/recommendations`.
- For charts on recommended page, call `/api/statistics` with the same price range.

## Versioning Recommendation

Current paths are under `/api/...`. If you expect frequent changes, consider migrating to `/api/v1/...` later while keeping current endpoints for backward compatibility.
