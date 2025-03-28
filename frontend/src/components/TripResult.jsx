import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import RouteMap from "./RouteMap";
import ELDLogViewer from "./ELDLogViewer";
// Add Heroicons import (you'll need to install it: npm install @heroicons/react)
import {
  MapIcon,
  TruckIcon,
  ClockIcon,
  CalendarIcon,
  DocumentIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  MapPinIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

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
        console.error("Error fetching trip data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId]);

  // Helper function for segment styling
  const getSegmentStyles = (type) => {
    switch (type) {
      case "DRIVE":
        return {
          icon: <TruckIcon className="h-5 w-5" />,
          color: "blue",
          label: "Driving",
        };
      case "REST":
        return {
          icon: <ClockIcon className="h-5 w-5" />,
          color: "amber",
          label: "Rest",
        };
      case "FUEL":
        return {
          icon: <MapPinIcon className="h-5 w-5" />,
          color: "green",
          label: "Fuel Stop",
        };
      case "PICKUP":
        return {
          icon: <MapPinIcon className="h-5 w-5" />,
          color: "purple",
          label: "Pickup",
        };
      case "DROPOFF":
        return {
          icon: <MapPinIcon className="h-5 w-5" />,
          color: "red",
          label: "Dropoff",
        };
      default:
        return {
          icon: <MapPinIcon className="h-5 w-5" />,
          color: "gray",
          label: type,
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md mx-auto">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-gray-100"></div>
            <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Loading Trip Details
          </h2>
          <p className="text-gray-500">
            Please wait while we retrieve your trip information...
          </p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md mx-auto">
          <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Error Loading Trip
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
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

  // Calculate stats
  const totalDistance = Math.round(
    trip.segments.reduce((sum, seg) => sum + seg.distance_miles, 0)
  );

  const totalDuration =
    Math.round(
      trip.segments.reduce(
        (sum, seg) => sum + seg.estimated_duration_hours,
        0
      ) * 10
    ) / 10;

  const requiredStops = trip.segments.filter(
    (seg) => seg.segment_type === "REST" || seg.segment_type === "FUEL"
  ).length;

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <div className="container mx-auto max-w-7xl py-8 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-white border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all shadow-sm"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            New Trip
          </Link>
          <button className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export Trip Plan
          </button>
        </div>

        {/* Title Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Trip Plan Results
          </h1>
          <div className="inline-flex items-center bg-white px-4 py-2 rounded-full shadow-sm text-gray-600">
            <span className="font-medium">{trip.current_location}</span>
            <ArrowRightIcon className="h-4 w-4 mx-2 text-gray-400" />
            <span className="font-medium">{trip.pickup_location}</span>
            <ArrowRightIcon className="h-4 w-4 mx-2 text-gray-400" />
            <span className="font-medium">{trip.dropoff_location}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transform transition-all hover:shadow-md">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <TruckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Distance
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {totalDistance} miles
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transform transition-all hover:shadow-md">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Duration
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {totalDuration} hours
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transform transition-all hover:shadow-md">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                <MapPinIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Required Stops
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {requiredStops}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`flex items-center px-6 py-4 transition-colors ${
                activeTab === 0
                  ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab(0)}
            >
              <MapIcon className="h-5 w-5 mr-2" />
              Route Map
            </button>
            <button
              className={`flex items-center px-6 py-4 transition-colors ${
                activeTab === 1
                  ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab(1)}
            >
              <TruckIcon className="h-5 w-5 mr-2" />
              Trip Segments
            </button>
            <button
              className={`flex items-center px-6 py-4 transition-colors ${
                activeTab === 2
                  ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab(2)}
            >
              <DocumentIcon className="h-5 w-5 mr-2" />
              ELD Logs
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 0 && (
              <div className="rounded-lg overflow-hidden border border-gray-200 shadow-inner">
                <RouteMap trip={trip} />
              </div>
            )}

            {activeTab === 1 && (
              <div className="space-y-4">
                {trip.segments.map((segment, index) => {
                  const style = getSegmentStyles(segment.segment_type);

                  return (
                    <div
                      key={index}
                      className={`p-5 rounded-lg border-l-4 border-${style.color}-500 bg-${style.color}-50 shadow-sm`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center">
                          <div className={`mr-4 text-${style.color}-600`}>
                            {style.icon}
                          </div>
                          <div>
                            <span
                              className={`inline-block px-3 py-1 text-xs font-medium text-${style.color}-700 bg-${style.color}-100 rounded-full mb-2`}
                            >
                              {style.label}
                            </span>
                            <h3 className="font-medium text-gray-900">
                              {segment.start_location} → {segment.end_location}
                            </h3>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-6">
                          <div>
                            <p className="text-xs text-gray-500 uppercase">
                              Distance
                            </p>
                            <p className="font-semibold">
                              {Math.round(segment.distance_miles)} miles
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">
                              Duration
                            </p>
                            <p className="font-semibold">
                              {Math.round(
                                segment.estimated_duration_hours * 10
                              ) / 10}{" "}
                              hours
                            </p>
                          </div>
                          {segment.estimated_completion_time && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase">
                                ETA
                              </p>
                              <p className="font-semibold">
                                {new Date(
                                  segment.estimated_completion_time
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 2 && (
              <div>
                <div className="flex overflow-x-auto space-x-2 border-b mb-6 pb-2">
                  {Object.keys(eldLogsByDate).map((date, index) => (
                    <button
                      key={date}
                      className={`flex items-center px-4 py-2 rounded-t-lg transition-colors ${
                        activeLogTab === index
                          ? "bg-blue-600 text-white font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      onClick={() => setActiveLogTab(index)}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {new Date(date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </button>
                  ))}
                </div>
                <div className="bg-gray-50 p-5 rounded-lg">
                  <ELDLogViewer
                    log={Object.values(eldLogsByDate)[activeLogTab]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripResult;
