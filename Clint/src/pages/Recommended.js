import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Chart, registerables } from "chart.js";
import { getRecommendations, getStatistics } from "../services/apiService";
import { formatPrice, formatPriceShort } from "../utils/formatters";
import "../css/recommended.css";
import "../css/normalize.css";

// Register Chart.js components
Chart.register(...registerables);

function Recommended() {
    const SLIDER_MIN = 300000;
    const SLIDER_MAX = 5000000;
    const SLIDER_STEP = 10000;

    const sliderRef = useRef(null);
    const doughnutChart1Ref = useRef(null);
    const doughnutChart2Ref = useRef(null);
    const barChartRef = useRef(null);
    const chart1Instance = useRef(null);
    const chart2Instance = useRef(null);
    const chart3Instance = useRef(null);
    const [priceRange, setPriceRange] = useState(300000);
    const [recommendations, setRecommendations] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [statsError, setStatsError] = useState("");

    const loadData = async (maxPrice) => {
        if (!maxPrice || maxPrice <= 0) {
            setError("priceRange must be greater than 0");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const recommendationData = await getRecommendations({
                minPrice: 0,
                maxPrice: Number(maxPrice),
                limit: 20,
            });

            setRecommendations(recommendationData.recommendations || []);
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRecommendedSubmit = () => {
        loadData(priceRange);
    };

    useEffect(() => {
        const slider = sliderRef.current;
        if (!slider) return;

        const progress =
            ((priceRange - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
        slider.style.setProperty("--progress", `${progress}%`);
    }, [priceRange]);

    useEffect(() => {
        getStatistics()
            .then((response) => {
                setStats(response);
            })
            .catch((statsLoadError) => {
                setStatsError(statsLoadError.message);
            });
    }, []);

    useEffect(() => {
        loadData(priceRange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!stats) return;

        const fuelDistribution =
            stats?.distributions?.fuelTypes || stats?.engineStats || {};
        const transmissionDistribution =
            stats?.distributions?.transmissionTypes ||
            stats?.transmissionStats ||
            {};
        const brandDistribution =
            stats?.distributions?.brands || stats?.brandStats || {};

        const fuelLabels = Object.keys(fuelDistribution);
        const fuelValues = Object.values(fuelDistribution);
        const transmissionLabels = Object.keys(transmissionDistribution);
        const transmissionValues = Object.values(transmissionDistribution);
        const topBrands = Object.entries(brandDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        const brandLabels = topBrands.map((brand) => brand[0]);
        const brandValues = topBrands.map((brand) => brand[1]);

        if (chart1Instance.current) chart1Instance.current.destroy();
        if (chart2Instance.current) chart2Instance.current.destroy();
        if (chart3Instance.current) chart3Instance.current.destroy();

        // Doughnut Chart 1 Configuration
        const ctx1 = doughnutChart1Ref.current;
        if (ctx1) {
            chart1Instance.current = new Chart(ctx1, {
                type: "doughnut",
                data: {
                    labels: fuelLabels.length > 0 ? fuelLabels : ["No data"],
                    datasets: [
                        {
                            data: fuelValues.length > 0 ? fuelValues : [1],
                            backgroundColor: [
                                "#14B8A6", // Teal
                                "#F97316", // Orange
                                "#3B82F6", // Blue
                                "#EC4899",
                                "#6366F1",
                            ],
                            borderWidth: 0,
                            cutout: "70%",
                            borderRadius: 5,
                            spacing: 2,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            padding: 12,
                            cornerRadius: 8,
                        },
                    },
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 1000,
                        easing: "easeInOutQuart",
                    },
                },
            });
        }

        // Doughnut Chart 2 Configuration
        const ctx2 = doughnutChart2Ref.current;
        if (ctx2) {
            chart2Instance.current = new Chart(ctx2, {
                type: "doughnut",
                data: {
                    labels:
                        transmissionLabels.length > 0
                            ? transmissionLabels
                            : ["No data"],
                    datasets: [
                        {
                            data:
                                transmissionValues.length > 0
                                    ? transmissionValues
                                    : [1],
                            backgroundColor: [
                                "#EC4899", // Pink
                                "#9CA3AF", // Gray
                                "#14B8A6",
                                "#F97316",
                            ],
                            borderWidth: 0,
                            cutout: "70%",
                            borderRadius: 5,
                            spacing: 2,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            padding: 12,
                            cornerRadius: 8,
                        },
                    },
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 1000,
                        easing: "easeInOutQuart",
                    },
                },
            });
        }

        // Bar Chart Configuration
        const ctx3 = barChartRef.current;
        if (ctx3) {
            chart3Instance.current = new Chart(ctx3, {
                type: "bar",
                data: {
                    labels: brandLabels.length > 0 ? brandLabels : ["No data"],
                    datasets: [
                        {
                            label: "Brand Distribution",
                            data: brandValues.length > 0 ? brandValues : [0],
                            backgroundColor: "red",
                            borderRadius: 8,
                            borderSkipped: false,
                            barThickness: 30,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function (context) {
                                    return "Count: " + context.parsed.y;
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: "#666", font: { size: 12 } },
                            border: { display: false },
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: "rgba(0, 0, 0, 0.05)",
                                drawBorder: false,
                            },
                            ticks: {
                                color: "#666",
                                font: { size: 12 },
                            },
                            border: { display: false },
                        },
                    },
                    animation: {
                        duration: 1000,
                        easing: "easeInOutQuart",
                    },
                },
            });
        }

        // Cleanup function to destroy charts
        return () => {
            if (chart1Instance.current) chart1Instance.current.destroy();
            if (chart2Instance.current) chart2Instance.current.destroy();
            if (chart3Instance.current) chart3Instance.current.destroy();
        };
    }, [stats]);

    return (
        <>
            <Navbar />

            {/* recommended Section */}
            <section className="recommended-section hero">
                <div className="container recommended-container">
                    {/* Left */}
                    <div className="recommended">
                        <h2>Recommended Car</h2>
                        <div className="recommended-box">
                            {/* Price Range */}
                            <div className="price-range">
                                <span>Select your price range</span>
                                <p>
                                    Selected Price:{" "}
                                    {formatPriceShort(priceRange)} EGP
                                </p>

                                <div className="slider-container">
                                    <span className="min-label">300K</span>
                                    <div className="slider-wrapper">
                                        <input
                                            ref={sliderRef}
                                            type="range"
                                            min={SLIDER_MIN}
                                            max={SLIDER_MAX}
                                            step={SLIDER_STEP}
                                            value={priceRange}
                                            onChange={(e) =>
                                                setPriceRange(
                                                    Number(e.target.value),
                                                )
                                            }
                                            id="slider"
                                        />
                                        <div className="slider-value" id="slider-Value">
                                            {formatPriceShort(priceRange)} EGP
                                        </div>
                                    </div>
                                    <span className="max-label">5M</span>
                                </div>
                            </div>
                            <button
                                className="btn submit-btn small"
                                onClick={handleRecommendedSubmit}
                            >
                                Submit
                            </button>
                            {loading && <p>Loading recommendations...</p>}
                            {error && (
                                <p style={{ color: "#b00020" }}>{error}</p>
                            )}

                            {/* Table */}
                            <h3>Your Recommended Cars</h3>
                            <table className="recommended-table">
                                <thead>
                                    <tr>
                                        <th>Brand</th>
                                        <th>Model</th>
                                        <th>Year</th>
                                        <th>Engine Type</th>
                                        <th>Body</th>
                                        <th>Engine V</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {recommendations.length === 0 &&
                                    !loading ? (
                                        <tr>
                                            <td colSpan="7">
                                                No recommendations found.
                                            </td>
                                        </tr>
                                    ) : (
                                        recommendations.map((car, index) => (
                                            <tr
                                                key={`${car.brand}-${car.model}-${index}`}
                                            >
                                                <td>{car.brand}</td>
                                                <td>{car.model}</td>
                                                <td>{car.year}</td>
                                                <td>{car.fuelType}</td>
                                                <td>{car.bodyType}</td>
                                                <td>{car.engineCapacityCc}</td>
                                                <td>
                                                    {formatPrice(car.priceEgp)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Divider */}
                    <hr />

                    {/* Right */}
                    <div className="statistics-box">
                        <span className="statistics-title">Statistics</span>
                        {!stats && !statsError && <p>Loading...</p>}
                        {statsError && (
                            <p style={{ color: "#b00020" }}>{statsError}</p>
                        )}

                        {/* Doughnut Charts Container */}
                        <div className="doughnut-charts">
                            <div className="chart-wrapper">
                                <canvas
                                    ref={doughnutChart1Ref}
                                    id="doughnutChart1"
                                ></canvas>
                                <div className="chart-center-text">
                                    <span className="percentage">
                                        {stats?.count ?? stats?.total ?? 0}
                                    </span>
                                    <span className="label">Engine Type</span>
                                </div>
                            </div>
                            <div className="chart-wrapper">
                                <canvas
                                    ref={doughnutChart2Ref}
                                    id="doughnutChart2"
                                ></canvas>
                                <div className="chart-center-text">
                                    <span className="percentage">
                                        {stats?.count ?? stats?.total ?? 0}
                                    </span>
                                    <span className="label">Transmission</span>
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart Container */}
                        <div className="bar-chart-wrapper">
                            <canvas ref={barChartRef} id="barChart"></canvas>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}

export default Recommended;
