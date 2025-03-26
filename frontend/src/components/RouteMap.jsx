import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Replace with your Geoapify API key
const GEOAPIFY_API_KEY = "ec4b42ecfa9c4b53a239b7ff842e5990";

const RouteMap = ({ trip }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!trip || !trip.segments || trip.segments.length === 0) {
      return;
    }

    if (map.current) return; // prevents map from initializing more than once

    // Initialize map using MapLibre GL JS with Geoapify tiles
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${GEOAPIFY_API_KEY}`,
      center: [-95.7129, 37.0902], // Center of US as default
      zoom: 3,
    });

    // Add controls
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      // Collect all locations for bounds calculation
      const locations = [];

      trip.segments.forEach((segment) => {
        // We're not using actual coordinates here since we'd need to geocode them
        // In a real application, you'd store and use the actual coordinates

        // Add markers for each significant point
        if (
          ["PICKUP", "DROPOFF", "FUEL", "REST"].includes(segment.segment_type)
        ) {
          const markerColor =
            segment.segment_type === "PICKUP"
              ? "#8B5CF6" // purple
              : segment.segment_type === "DROPOFF"
              ? "#EF4444" // red
              : segment.segment_type === "FUEL"
              ? "#10B981" // green
              : "#F59E0B"; // orange for REST

          const markerElement = document.createElement("div");
          markerElement.style.width = "20px";
          markerElement.style.height = "20px";
          markerElement.style.borderRadius = "50%";
          markerElement.style.backgroundColor = markerColor;
          markerElement.style.border = "2px solid white";

          new maplibregl.Marker({ element: markerElement })
            .setLngLat([-95.7129, 37.0902]) // This should be the actual coordinates
            .setPopup(
              new maplibregl.Popup({ offset: 25 }).setHTML(
                `<h3>${segment.segment_type}</h3>
                <p>${segment.start_location}</p>
                <p>${new Date(segment.start_time).toLocaleString()}</p>`
              )
            )
            .addTo(map.current);

          locations.push([-95.7129, 37.0902]); // Add to bounds calculation
        }
      });

      // In a real application, we would add the actual route geometry from the backend
      // For this demo, we'll add a placeholder line
      map.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [-122.4194, 37.7749], // San Francisco
              [-118.2437, 34.0522], // Los Angeles
              [-112.074, 33.4484], // Phoenix
              [-104.9903, 39.7392], // Denver
              [-95.7129, 37.0902], // Center of US (placeholder)
            ],
          },
        },
      });

      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3182CE",
          "line-width": 4,
        },
      });

      // Fit map to include all locations
      if (locations.length > 0) {
        const bounds = locations.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new maplibregl.LngLatBounds(locations[0], locations[0]));

        map.current.fitBounds(bounds, {
          padding: 50,
        });
      }
    });

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [trip]);

  return (
    <div
      ref={mapContainer}
      className="h-[500px] w-full rounded-md overflow-hidden"
    />
  );
};

export default RouteMap;
