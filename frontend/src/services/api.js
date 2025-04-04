import axios from "axios";

// Get base URL from environment variable or default to "/api" for local development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log("!!! Using API Base URL:", API_BASE_URL);
export const tripService = {
  createTrip: async (tripData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/trips/`, tripData);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Failed to create trip");
    }
  },

  getTripById: async (tripId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Failed to fetch trip details");
    }
  },
};
