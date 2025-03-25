import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TripPlanner from "./components/TripPlanner";
import TripResult from "./components/TripResult";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TripPlanner />} />
        <Route path="/result/:tripId" element={<TripResult />} />
      </Routes>
    </Router>
  );
}

export default App;
