import React from "react";
import "../css/car-thumbnail.css";

function CarThumbnail({ carImage, onImageClick, carName }) {
    return (
        <div className="thumbnail-wrapper">
            <div
                className="thumbnail-container"
                onClick={onImageClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        onImageClick();
                    }
                }}
                aria-label={`Open image gallery for ${carName}`}
            >
                <img
                    src={carImage}
                    alt={`${carName} thumbnail`}
                    className="thumbnail-image"
                    loading="lazy"
                    onError={(e) => {
                        e.target.src =
                            "https://via.placeholder.com/80?text=No+Image";
                    }}
                />
                <div className="thumbnail-overlay">
                    <span className="view-gallery-icon">🔍</span>
                </div>
            </div>
        </div>
    );
}

export default CarThumbnail;
