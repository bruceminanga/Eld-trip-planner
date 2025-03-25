import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "https://your-backend-domain.com/api";

const TripPlanner = () => {
  const [formData, setFormData] = useState({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    current_cycle_used: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      if (
        !formData.current_location ||
        !formData.pickup_location ||
        !formData.dropoff_location ||
        !formData.current_cycle_used
      ) {
        throw new Error("All fields are required");
      }

      // Convert current_cycle_used to a float
      const current_cycle_used = parseFloat(formData.current_cycle_used);
      if (
        isNaN(current_cycle_used) ||
        current_cycle_used < 0 ||
        current_cycle_used > 70
      ) {
        throw new Error("Current cycle used must be a number between 0 and 70");
      }

      // Send data to API
      const response = await axios.post(`${API_BASE_URL}/trips/`, {
        ...formData,
        current_cycle_used,
      });

      // Navigate to result page
      navigate(`/result/${response.data.id}`);
    } catch (error) {
      // Basic error handling without Chakra toast
      alert(
        error.response?.data?.error || error.message || "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md py-8">
      <div className="flex flex-col space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">ELD Trip Planner</h1>
          <p className="text-gray-600">
            Plan your route with automatic ELD compliance
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-md shadow-md"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="current_location"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current Location
              </label>
              <input
                id="current_location"
                name="current_location"
                value={formData.current_location}
                onChange={handleChange}
                placeholder="Enter your current location"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="pickup_location"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pickup Location
              </label>
              <input
                id="pickup_location"
                name="pickup_location"
                value={formData.pickup_location}
                onChange={handleChange}
                placeholder="Enter pickup location"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="dropoff_location"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Dropoff Location
              </label>
              <input
                id="dropoff_location"
                name="dropoff_location"
                value={formData.dropoff_location}
                onChange={handleChange}
                placeholder="Enter dropoff location"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="current_cycle_used"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current Cycle Used
              </label>
              <div className="flex">
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
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="inline-flex items-center px-3 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md text-gray-500">
                  hours
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-md text-white font-semibold transition-colors ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Calculating route..." : "Plan Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripPlanner;
