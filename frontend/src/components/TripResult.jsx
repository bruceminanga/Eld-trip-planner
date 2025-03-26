import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import RouteMap from "./RouteMap";
import ELDLogViewer from "./ELDLogViewer";

const API_BASE_URL = "/api";

const TripResult = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLogTab, setActiveLogTab] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/`);
        setTrip(response.data);
      } catch (err) {
        setError("Failed to load trip data. Please try again.");
        alert("Failed to load trip data");
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId]);

  if (loading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mb-4"></div>
          <p>Loading your trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="container mx-auto flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl text-red-500 mb-4">Error Loading Trip</h2>
          <p>{error}</p>
          <Link
            to="/"
            className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Trip Planner
          </Link>
        </div>
      </div>
    );
  }

  // Group ELD logs by date
  const eldLogsByDate = {};
  if (trip.eld_logs && trip.eld_logs.length > 0) {
    trip.eld_logs.forEach((log) => {
      eldLogsByDate[log.date] = log;
    });
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="flex justify-between mb-8">
        <Link
          to="/"
          className="px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition flex items-center"
        >
          ← New Trip
        </Link>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center">
          Export Trip Plan
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Trip Plan Results</h1>
        <p className="text-lg text-gray-600">
          Route from {trip.current_location} to {trip.dropoff_location} via{" "}
          {trip.pickup_location}
        </p>
      </div>

      <div className="bg-white p-6 rounded-md shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-4 bg-blue-50 rounded-md">
            <p className="text-gray-500 text-sm">Total Distance</p>
            <p className="text-2xl font-bold">
              {Math.round(
                trip.segments.reduce((sum, seg) => sum + seg.distance_miles, 0)
              )}{" "}
              miles
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-md">
            <p className="text-gray-500 text-sm">Total Duration</p>
            <p className="text-2xl font-bold">
              {Math.round(
                trip.segments.reduce(
                  (sum, seg) => sum + seg.estimated_duration_hours,
                  0
                ) * 10
              ) / 10}{" "}
              hours
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-md">
            <p className="text-gray-500 text-sm">Required Stops</p>
            <p className="text-2xl font-bold">
              {
                trip.segments.filter(
                  (seg) =>
                    seg.segment_type === "REST" || seg.segment_type === "FUEL"
                ).length
              }
            </p>
          </div>
        </div>

        <div>
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 ${
                activeTab === 0
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab(0)}
            >
              Route Map
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === 1
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab(1)}
            >
              Trip Segments
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === 2
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab(2)}
            >
              ELD Logs
            </button>
          </div>

          {activeTab === 0 && <RouteMap trip={trip} />}

          {activeTab === 1 && (
            <div className="space-y-4">
              {trip.segments.map((segment, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-md border-l-4 ${
                    segment.segment_type === "DRIVE"
                      ? "border-l-blue-500"
                      : segment.segment_type === "REST"
                      ? "border-l-orange-500"
                      : segment.segment_type === "FUEL"
                      ? "border-l-green-500"
                      : segment.segment_type === "PICKUP"
                      ? "border-l-purple-500"
                      : "border-l-red-500"
                  }`}
                >
                  {/* Segment details similar to previous implementation */}
                </div>
              ))}
            </div>
          )}

          {activeTab === 2 && (
            <div>
              <div className="flex overflow-x-auto mb-4">
                {Object.keys(eldLogsByDate).map((date, index) => (
                  <button
                    key={date}
                    className={`px-4 py-2 whitespace-nowrap ${
                      activeLogTab === index
                        ? "bg-green-100 text-green-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveLogTab(index)}
                  >
                    {new Date(date).toLocaleDateString()}
                  </button>
                ))}
              </div>
              <ELDLogViewer log={Object.values(eldLogsByDate)[activeLogTab]} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripResult;
