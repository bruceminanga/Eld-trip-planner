// frontend/src/services/api.js
import axios from "axios";

// ALWAYS use the relative path for client-side requests.
// The Vite proxy will handle forwarding this to the correct backend.
const API_BASE_URL = "/api";

console.log("Using API Base URL for all requests:", API_BASE_URL);

export const tripService = {
  createTrip: async (tripData) => {
    try {
      // The final URL will be "/api/trips/"
      const response = await axios.post(`${API_BASE_URL}/trips/`, tripData);
      return response.data;
    } catch (error) {
      // It's helpful to log the full error object to see more details
      console.error("Create trip error:", error);
      throw error.response?.data || new Error("Failed to create trip");
    }
  },

  getTripById: async (tripId) => {
    try {
      // The final URL will be "/api/trips/{tripId}/"
      const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/`);
      return response.data;
    } catch (error) {
      console.error("Get trip error:", error);
      throw error.response?.data || new Error("Failed to fetch trip details");
    }
  },
};
