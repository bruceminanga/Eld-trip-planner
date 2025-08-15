import axios from "axios";

// Use environment variable with fallback to proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
console.log("!!! Using API Base URL:", API_BASE_URL);
console.log("!!! Environment variables:", import.meta.env);

export const tripService = {
  createTrip: async (tripData) => {
    try {
      console.log("Making request to:", `${API_BASE_URL}/trips/`);
      const response = await axios.post(`${API_BASE_URL}/trips/`, tripData);
      return response.data;
    } catch (error) {
      console.error("Create trip error:", error);
      throw error.response?.data || new Error("Failed to create trip");
    }
  },

  getTripById: async (tripId) => {
    try {
      console.log("Making request to:", `${API_BASE_URL}/trips/${tripId}/`);
      const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/`);
      return response.data;
    } catch (error) {
      console.error("Get trip error:", error);
      throw error.response?.data || new Error("Failed to fetch trip details");
    }
  },
};
