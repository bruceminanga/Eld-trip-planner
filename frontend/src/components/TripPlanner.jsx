import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Simple SVG icons as components
const LocationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-indigo-500"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
      clipRule="evenodd"
    />
  </svg>
);

const PickupIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-indigo-500"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7h1a1 1 0 011 1v6.05A2.5 2.5 0 0014 16.5h-1V7z" />
  </svg>
);

const DropoffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-indigo-500"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
      clipRule="evenodd"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-indigo-500"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
      clipRule="evenodd"
    />
  </svg>
);

const RouteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
      clipRule="evenodd"
    />
  </svg>
);

const TripPlanner = () => {
  const [formData, setFormData] = useState({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    current_cycle_used: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.current_location.trim()) {
      newErrors.current_location = "Current location is required";
    }

    if (!formData.pickup_location.trim()) {
      newErrors.pickup_location = "Pickup location is required";
    }

    if (!formData.dropoff_location.trim()) {
      newErrors.dropoff_location = "Dropoff location is required";
    }

    if (!formData.current_cycle_used) {
      newErrors.current_cycle_used = "Current cycle used is required";
    } else {
      const cycleUsed = parseFloat(formData.current_cycle_used);
      if (isNaN(cycleUsed) || cycleUsed < 0 || cycleUsed > 70) {
        newErrors.current_cycle_used = "Must be between 0 and 70 hours";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const current_cycle_used = parseFloat(formData.current_cycle_used);

      // Send data to API
      const response = await axios.post(`${API_BASE_URL}/trips/`, {
        ...formData,
        current_cycle_used,
      });

      // Navigate to result page
      navigate(`/result/${response.data.id}`);
    } catch (error) {
      setErrors({
        form:
          error.response?.data?.error ||
          error.message ||
          "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white mb-5">
            <RouteIcon />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            ELD Trip Planner
          </h1>
          <p className="text-gray-600 text-lg">
            Plan your route with automatic ELD compliance
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
          {errors.form && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <p className="text-sm text-red-700">{errors.form}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="current_location"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
                >
                  <LocationIcon />
                  Current Location
                </label>
                <input
                  id="current_location"
                  name="current_location"
                  value={formData.current_location}
                  onChange={handleChange}
                  placeholder="Enter your current location"
                  className={`w-full px-4 py-3 border ${
                    errors.current_location
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
                />
                {errors.current_location && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.current_location}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="pickup_location"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
                >
                  <PickupIcon />
                  Pickup Location
                </label>
                <input
                  id="pickup_location"
                  name="pickup_location"
                  value={formData.pickup_location}
                  onChange={handleChange}
                  placeholder="Enter pickup location"
                  className={`w-full px-4 py-3 border ${
                    errors.pickup_location
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
                />
                {errors.pickup_location && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.pickup_location}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dropoff_location"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
                >
                  <DropoffIcon />
                  Dropoff Location
                </label>
                <input
                  id="dropoff_location"
                  name="dropoff_location"
                  value={formData.dropoff_location}
                  onChange={handleChange}
                  placeholder="Enter dropoff location"
                  className={`w-full px-4 py-3 border ${
                    errors.dropoff_location
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
                />
                {errors.dropoff_location && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.dropoff_location}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="current_cycle_used"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
                >
                  <ClockIcon />
                  Current Cycle Used
                </label>
                <div className="relative mt-1 rounded-lg shadow-sm">
                  <input
                    id="current_cycle_used"
                    name="current_cycle_used"
                    value={formData.current_cycle_used}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    max="70"
                    step="0.5"
                    placeholder="Hours used in current cycle"
                    className={`w-full px-4 py-3 pr-12 border ${
                      errors.current_cycle_used
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <span className="px-4 text-gray-500 font-medium">
                      hours
                    </span>
                  </div>
                </div>
                {errors.current_cycle_used && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.current_cycle_used}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-lg text-white font-medium text-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Calculating route...
                  </div>
                ) : (
                  "Plan Trip"
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center mt-6 text-gray-500 text-sm">
          Optimizing your routes for maximum efficiency and ELD compliance
        </p>
      </div>
    </div>
  );
};

export default TripPlanner;
