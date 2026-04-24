import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { submitContact } from "../services/apiService";
import "../css/index.css";
import "../css/normalize.css";

function Home() {
    const location = useLocation();
    const [contactFormData, setContactFormData] = React.useState({
        name: "",
        email: "",
        message: "",
    });
    const [contactStatus, setContactStatus] = React.useState("");
    const [contactError, setContactError] = React.useState("");
    const [contactLoading, setContactLoading] = React.useState(false);

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setContactStatus("");
        setContactError("");

        // Validation
        const missingFields = [];
        if (!contactFormData.name || contactFormData.name.trim() === "")
            missingFields.push("name");
        if (!contactFormData.email || contactFormData.email.trim() === "")
            missingFields.push("email");
        if (!contactFormData.message || contactFormData.message.trim() === "")
            missingFields.push("message");

        if (missingFields.length > 0) {
            setContactError(`Please complete: ${missingFields.join(", ")}`);
            return;
        }

        try {
            setContactLoading(true);
            await submitContact(contactFormData);
            setContactStatus("Your message has been sent successfully.");
            setContactFormData({ name: "", email: "", message: "" });
        } catch (error) {
            setContactError(error.message);
        } finally {
            setContactLoading(false);
        }
    };

    const handleContactChange = (field, value) => {
        setContactFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    useEffect(() => {
        const targetId = location.state?.scrollTo;
        if (targetId) {
            const el = document.getElementById(targetId);
            if (el) {
                el.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [location.state]);

    useEffect(() => {
        // Smooth scroll for "Get Started" button
        const startedBtn = document.querySelector(".hero-text .btn");
        if (startedBtn) {
            const handleClick = () => {
                const aboutSection = document.getElementById("about");
                if (aboutSection) {
                    aboutSection.scrollIntoView({ behavior: "smooth" });
                }
            };
            startedBtn.addEventListener("click", handleClick);

            return () => {
                startedBtn.removeEventListener("click", handleClick);
            };
        }
    }, []);

    return (
        <>
            <Navbar />

            {/* Home Section */}
            <section id="home" className="hero">
                <div className="container">
                    <div className="hero-text">
                        <h1>Vehicle Valuation</h1>
                        <p>
                            Helps you estimate the real market value of used
                            cars using data-driven analysis and machine
                            learning. By entering basic vehicle details, you get
                            an accurate price estimate along with insights to
                            support smarter buying and selling decisions.
                        </p>
                        <button className="btn">Get Started</button>
                    </div>

                    <div className="hero-image">
                        <img src="/Photo/car.png" alt="Car" />
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="hero">
                <div className="container">
                    <div className="about-box">
                        <h1>About Us</h1>
                        <p>
                            Vehicle Valuation is a data-driven platform designed
                            to help users understand the true market value of
                            used vehicles. By combining real-world automotive
                            data with machine learning techniques, we provide
                            accurate price estimates and meaningful insights
                            that support smarter buying and selling decisions.
                        </p>
                        <p>
                            Our goal is to simplify vehicle pricing by turning
                            complex market data into clear, actionable
                            information. Whether you're a buyer, seller, or
                            automotive enthusiast, Vehicle Valuation offers a
                            reliable and transparent way to evaluate cars based
                            on real market trends.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="hero">
                <div className="container">
                    <div className="contact">
                        {/* Left Text */}
                        <div className="contact-info">
                            <h1>Contact Us</h1>
                            <p>
                                Have questions about vehicle pricing or data
                                insights? Feel free to reach out to us anytime.
                            </p>
                            <p className="email">
                                Email us at:
                                <span>example@mail.com</span>
                            </p>
                        </div>
                        <hr className="vertical-divider" />
                        {/* Right Form */}
                        <form
                            className="contact-form"
                            onSubmit={handleContactSubmit}
                        >
                            <input
                                type="text"
                                placeholder="Name"
                                value={contactFormData.name}
                                onChange={(e) =>
                                    handleContactChange("name", e.target.value)
                                }
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={contactFormData.email}
                                onChange={(e) =>
                                    handleContactChange("email", e.target.value)
                                }
                            />
                            <textarea
                                placeholder="Message"
                                value={contactFormData.message}
                                onChange={(e) =>
                                    handleContactChange(
                                        "message",
                                        e.target.value,
                                    )
                                }
                            ></textarea>
                            <button type="submit" className="btn">
                                {contactLoading ? "Sending..." : "Send"}
                            </button>
                            {contactStatus && (
                                <p style={{ color: "#0b6b2c" }}>
                                    {contactStatus}
                                </p>
                            )}
                            {contactError && (
                                <p style={{ color: "#b00020" }}>
                                    {contactError}
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}

export default Home;
