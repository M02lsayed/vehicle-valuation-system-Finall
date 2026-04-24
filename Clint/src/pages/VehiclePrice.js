import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CustomDropdown from "../components/CustomDropdown";
import {
    getVehicleOptions,
    getModelsByBrand,
    predictVehiclePrice,
} from "../services/apiService";
import { formatPrice } from "../utils/formatters";
import "../css/vehicle-price.css";
import "../css/normalize.css";

function VehiclePrice() {
    const [selectedValues, setSelectedValues] = useState({
        brand: "",
        model: "",
        engine: "",
        body: "",
        registration: "",
    });
    const [year, setYear] = useState("");
    const [mileage, setMileage] = useState("");
    const [engineV, setEngineV] = useState("");
    const [options, setOptions] = useState({
        brands: [],
        fuelTypes: [],
        bodyTypes: [],
        transmissionTypes: [],
    });
    const [models, setModels] = useState([]);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const isModelDisabled = !selectedValues.brand;

    // Handle form field changes
    const handleVehicleFormChange = (field, value) => {
        if (field === "year" || field === "mileage" || field === "engineV") {
            if (field === "year") setYear(value);
            if (field === "mileage") setMileage(value);
            if (field === "engineV") setEngineV(value);
        } else {
            setSelectedValues((prev) => ({
                ...prev,
                [field]: value,
            }));
        }
    };

    // Load options on mount.
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const data = await getVehicleOptions();
                setOptions({
                    brands: data.brands || [],
                    fuelTypes: data.fuelTypes || [],
                    bodyTypes: data.bodyTypes || [],
                    transmissionTypes: data.transmissionTypes || [],
                });
            } catch (loadError) {
                setError(loadError.message);
            }
        };

        loadOptions();
    }, []);

    // Load models whenever selected brand changes.
    useEffect(() => {
        const selectedBrand = selectedValues.brand;

        if (!selectedBrand) {
            setModels([]);
            return;
        }

        const loadModels = async () => {
            try {
                const data = await getModelsByBrand(selectedBrand);
                setModels(data.models || []);
            } catch (loadError) {
                setModels([]);
                setError(loadError.message);
            }
        };

        loadModels();
    }, [selectedValues.brand]);

    // Handle form submission.
    const handleVehicleSubmit = async () => {
        setError("");
        setResult(null);

        const payload = {
            brand: selectedValues.brand,
            model: selectedValues.model,
            year: Number(year),
            kilometers: Number(mileage),
            fuelType: selectedValues.engine,
            transmissionType: selectedValues.registration,
            engineCapacityCc: Number(engineV),
            bodyType: selectedValues.body,
        };

        // Validation
        const missingFields = [];
        if (!payload.brand) missingFields.push("brand");
        if (!payload.model) missingFields.push("model");
        if (!year) missingFields.push("year");
        if (!mileage) missingFields.push("mileage");
        if (!payload.fuelType) missingFields.push("fuelType");
        if (!payload.bodyType) missingFields.push("bodyType");
        if (!engineV) missingFields.push("engineCapacityCc");
        if (!payload.transmissionType) {
            missingFields.push("transmissionType");
        }

        if (missingFields.length > 0) {
            setError(`Please complete: ${missingFields.join(", ")}`);
            return;
        }

        try {
            setLoading(true);
            const prediction = await predictVehiclePrice(payload);
            setResult(prediction);
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />

            {/* Vehicle Price Section */}
            <section className="hero vehicle-price">
                <div className="container vehicle-container">
                    {/* Form */}
                    <div className="vehicle-form">
                        <h1>Vehicle Value</h1>

                        <div className="form-grid">
                            <CustomDropdown
                                options={options.brands}
                                value={selectedValues.brand}
                                placeholder="Car's Brand"
                                onChange={(value) => {
                                    handleVehicleFormChange("brand", value);
                                    handleVehicleFormChange("model", "");
                                }}
                            />

                            <CustomDropdown
                                options={models}
                                value={selectedValues.model}
                                placeholder="Car's Model"
                                disabled={isModelDisabled}
                                onChange={(value) =>
                                    handleVehicleFormChange("model", value)
                                }
                            />

                            <input
                                type="number"
                                placeholder="Year"
                                lang="en"
                                dir="ltr"
                                value={year}
                                min="0"
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "-" ||
                                        e.key === "e" ||
                                        e.key === "+"
                                    ) {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                        value === "" ||
                                        parseFloat(value) >= 0
                                    ) {
                                        handleVehicleFormChange("year", value);
                                    }
                                }}
                                onWheel={(e) => e.target.blur()}
                                style={{
                                    WebkitAppearance: "none",
                                    MozAppearance: "textfield",
                                    appearance: "textfield",
                                    margin: 0,
                                }}
                            />
                            <input
                                type="number"
                                placeholder="Mileage"
                                lang="en"
                                dir="ltr"
                                value={mileage}
                                min="0"
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "-" ||
                                        e.key === "e" ||
                                        e.key === "+"
                                    ) {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                        value === "" ||
                                        parseFloat(value) >= 0
                                    ) {
                                        handleVehicleFormChange(
                                            "mileage",
                                            value,
                                        );
                                    }
                                }}
                                onWheel={(e) => e.target.blur()}
                                style={{
                                    WebkitAppearance: "none",
                                    MozAppearance: "textfield",
                                    appearance: "textfield",
                                    margin: 0,
                                }}
                            />

                            <CustomDropdown
                                options={options.fuelTypes}
                                value={selectedValues.engine}
                                placeholder="Engine Type"
                                onChange={(value) =>
                                    handleVehicleFormChange("engine", value)
                                }
                            />

                            <CustomDropdown
                                options={options.bodyTypes}
                                value={selectedValues.body}
                                placeholder="Body"
                                onChange={(value) =>
                                    handleVehicleFormChange("body", value)
                                }
                            />

                            <input
                                type="number"
                                placeholder="Engine V"
                                value={engineV}
                                onChange={(e) =>
                                    handleVehicleFormChange(
                                        "engineV",
                                        e.target.value,
                                    )
                                }
                            />

                            <CustomDropdown
                                options={options.transmissionTypes}
                                value={selectedValues.registration}
                                placeholder="Transmission"
                                onChange={(value) =>
                                    handleVehicleFormChange(
                                        "registration",
                                        value,
                                    )
                                }
                            />
                        </div>

                        <button
                            className="btn submit-btn"
                            onClick={handleVehicleSubmit}
                        >
                            Submit
                        </button>
                    </div>

                    {/* Vertical Divider */}
                    <hr className="vertical-divider" />

                    {/* Result */}
                    <div className="vehicle-result">
                        <h2>Estimated Value</h2>
                        <div className="price-box">
                            {loading
                                ? "Calculating..."
                                : result
                                  ? `${formatPrice(result.estimatedPriceEgp)} EGP`
                                  : "-------"}
                        </div>
                        {result && (
                            <p>
                                Confidence: {result.confidence}% | Position:{" "}
                                {result.marketPosition}
                            </p>
                        )}
                        {error && <p style={{ color: "#b00020" }}>{error}</p>}
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}

export default VehiclePrice;
