const express = require("express");

function createRecommendationRoutes({ handleRecommendations, handleStatistics }) {
    const router = express.Router();

    router.get("/api/recommendations", handleRecommendations);
    router.get("/api/statistics", handleStatistics);

    return router;
}

module.exports = createRecommendationRoutes;
