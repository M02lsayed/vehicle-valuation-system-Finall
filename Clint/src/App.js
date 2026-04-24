import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Recommended from "./pages/Recommended";
import VehiclePrice from "./pages/VehiclePrice";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/recommended" element={<Recommended />} />
                <Route path="/vehicle-price" element={<VehiclePrice />} />
            </Routes>
        </Router>
    );
}

export default App;
