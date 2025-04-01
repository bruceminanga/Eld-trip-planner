import axios from "axios";

// Get base URL from environment variable or default to "/api" for local development
const API_BASE_URL = "https://eld-trip-planner-0e76.onrender.com/api";

// Add this line at the top level to see if the module is being loaded
console.error("🔴 tripService module loaded, API_BASE_URL:", API_BASE_URL);

export const tripService = {
  createTrip: async (tripData) => {
    console.error("🔴 createTrip called with data:", tripData);
    console.error("🔴 Using API Base URL:", API_BASE_URL);
    try {
      console.error(
        "🔴 About to make POST request to:",
        `${API_BASE_URL}/trips/`
      );
      const response = await axios.post(`${API_BASE_URL}/trips/`, tripData);
      console.error("🔴 POST request successful, response:", response.data);
      return response.data;
    } catch (error) {
      console.error("🔴 POST request failed:", error);
      throw error.response?.data || new Error("Failed to create trip");
    }
  },

  getTripById: async (tripId) => {
    console.error("🔴 getTripById called with ID:", tripId);
    try {
      const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/`);
      return response.data;
    } catch (error) {
      console.error("🔴 Failed to fetch trip:", error);
      throw error.response?.data || new Error("Failed to fetch trip details");
    }
  },
};
