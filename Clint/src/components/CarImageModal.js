import React, { useState, useEffect } from "react";
import "../css/car-image-modal.css";

function CarImageModal({ isOpen, onClose, images, carName }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Reset index when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentImageIndex(0);
        }
    }, [isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "ArrowLeft") {
                handlePrevImage();
            } else if (e.key === "ArrowRight") {
                handleNextImage();
            } else if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, currentImageIndex, images]);

    const handleNextImage = () => {
        setCurrentImageIndex((prev) =>
            prev === (images?.length || 0) - 1 ? 0 : prev + 1,
        );
    };

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? (images?.length || 0) - 1 : prev - 1,
        );
    };

    const handleDotClick = (index) => {
        setCurrentImageIndex(index);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen || !images || images.length === 0) {
        return null;
    }

    const currentImage = images[currentImageIndex] || "";

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-container">
                {/* Close Button */}
                <button
                    className="modal-close-btn"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    ✕
                </button>

                {/* Main Image */}
                <div className="modal-image-wrapper">
                    <img
                        src={currentImage}
                        alt={`${carName} - Image ${currentImageIndex + 1}`}
                        className="modal-image"
                        loading="lazy"
                    />

                    {/* Image Counter */}
                    <div className="image-counter">
                        {currentImageIndex + 1} / {images.length}
                    </div>
                </div>

                {/* Navigation Buttons */}
                {images.length > 1 && (
                    <>
                        <button
                            className="nav-button prev-button"
                            onClick={handlePrevImage}
                            aria-label="Previous image"
                        >
                            ❮
                        </button>
                        <button
                            className="nav-button next-button"
                            onClick={handleNextImage}
                            aria-label="Next image"
                        >
                            ❯
                        </button>
                    </>
                )}

                {/* Carousel Indicators */}
                {images.length > 1 && (
                    <div className="carousel-indicators">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                className={`indicator ${
                                    index === currentImageIndex ? "active" : ""
                                }`}
                                onClick={() => handleDotClick(index)}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Car Name and Info */}
                <div className="modal-info">
                    <h3>{carName}</h3>
                    {images.length > 1 && (
                        <p className="image-info">
                            Swipe or use arrow keys to navigate
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CarImageModal;
