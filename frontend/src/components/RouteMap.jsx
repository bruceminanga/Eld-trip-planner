import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Replace with your Geoapify API key
const GEOAPIFY_API_KEY = "ec4b42ecfa9c4b53a239b7ff842e5990";

// Segment type configuration for styling consistency
const SEGMENT_CONFIG = {
  PICKUP: { color: "#8B5CF6", icon: "P", label: "Pickup" },
  DROPOFF: { color: "#EF4444", icon: "D", label: "Dropoff" },
  FUEL: { color: "#10B981", icon: "F", label: "Fuel Stop" },
  REST: { color: "#F59E0B", icon: "R", label: "Rest Stop" },
};

const RouteMap = ({ trip }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!trip || !trip.segments || trip.segments.length === 0) {
      setError("No trip data available");
      setLoading(false);
      return;
    }

    if (map.current) return; // prevents map from initializing more than once

    // Initialize map using MapLibre GL JS with Geoapify tiles
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${GEOAPIFY_API_KEY}`,
      center: [-95.7129, 37.0902], // Center of US as default
      zoom: 3,
      attributionControl: false,
    });

    // Add controls
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    map.current.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.current.on("load", () => {
      try {
        // Collect all locations for bounds calculation
        const locations = [];

        // Add route line
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

        // Add route outline (shadow effect)
        map.current.addLayer({
          id: "route-outline",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#000",
            "line-width": 8,
            "line-opacity": 0.2,
          },
        });

        // Add main route line
        map.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3B82F6",
            "line-width": 5,
            "line-dasharray": [2, 1],
          },
        });

        // Process segments and add markers
        trip.segments.forEach((segment, index) => {
          if (
            ["PICKUP", "DROPOFF", "FUEL", "REST"].includes(segment.segment_type)
          ) {
            const config = SEGMENT_CONFIG[segment.segment_type];

            // Create custom marker element
            const markerElement = document.createElement("div");
            markerElement.className = "custom-marker";
            markerElement.innerHTML = `
              <div class="marker-dot" style="background-color: ${config.color}">
                <span class="marker-text">${config.icon}</span>
              </div>
              <div class="marker-pulse" style="border-color: ${config.color}"></div>
            `;

            // Add marker with animation
            setTimeout(() => {
              new maplibregl.Marker({ element: markerElement })
                .setLngLat([-95.7129 + index * 5, 37.0902]) // This should be actual coordinates
                .setPopup(
                  new maplibregl.Popup({ offset: 25, closeButton: false })
                    .setHTML(`
                    <div class="popup-content">
                      <h3 style="color: ${
                        config.color
                      }; font-weight: 600; margin-bottom: 5px;">
                        ${config.label}
                      </h3>
                      <p style="margin: 0 0 3px; font-size: 14px;">${
                        segment.start_location
                      }</p>
                      <p style="margin: 0; font-size: 12px; color: #666;">
                        ${new Date(segment.start_time).toLocaleString()}
                      </p>
                    </div>
                  `)
                )
                .addTo(map.current);

              // Add to bounds calculation
              locations.push([-95.7129 + index * 5, 37.0902]);
            }, index * 200); // Stagger marker appearance
          }
        });

        // Fit map to include all locations
        setTimeout(() => {
          if (locations.length > 0) {
            const bounds = locations.reduce((bounds, coord) => {
              return bounds.extend(coord);
            }, new maplibregl.LngLatBounds(locations[0], locations[0]));

            map.current.fitBounds(bounds, {
              padding: 60,
              duration: 1000, // smooth animation
            });
          }
          setLoading(false);
        }, trip.segments.length * 200 + 300);

        // Add legend
        const legendContainer = document.createElement("div");
        legendContainer.className = "map-legend";
        legendContainer.innerHTML = `
          <div class="legend-title">Trip Legend</div>
          ${Object.entries(SEGMENT_CONFIG)
            .map(
              ([key, config]) => `
            <div class="legend-item">
              <span class="legend-color" style="background-color: ${config.color}"></span>
              <span>${config.label}</span>
            </div>
          `
            )
            .join("")}
        `;
        mapContainer.current.appendChild(legendContainer);
      } catch (err) {
        console.error("Error rendering map:", err);
        setError("Failed to load map");
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      const legendEl = mapContainer.current?.querySelector(".map-legend");
      if (legendEl) legendEl.remove();
    };
  }, [trip]);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-lg border border-gray-200">
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-700 font-medium">Loading map...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-gray-700">{error}</p>
        </div>
      )}

      <div ref={mapContainer} className="h-full w-full">
        {/* Map renders here */}
      </div>

      <style jsx global>{`
        /* Custom marker styling */
        .custom-marker {
          width: 32px;
          height: 32px;
          position: relative;
          cursor: pointer;
        }

        .marker-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }

        .marker-text {
          color: white;
          font-weight: bold;
          font-size: 13px;
        }

        .custom-marker:hover .marker-dot {
          transform: scale(1.1);
        }

        .marker-pulse {
          position: absolute;
          top: -4px;
          left: -4px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid;
          animation: pulse 2s infinite;
          opacity: 0;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.95);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        /* Legend styling */
        .map-legend {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background-color: white;
          border-radius: 8px;
          padding: 10px 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          font-size: 12px;
          max-width: 180px;
          z-index: 1;
          opacity: 0.9;
          transition: opacity 0.2s;
        }

        .map-legend:hover {
          opacity: 1;
        }

        .legend-title {
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 5px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }

        /* Popup styling */
        .maplibregl-popup {
          max-width: 200px !important;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .maplibregl-popup-content {
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
        }

        .popup-content {
          padding: 3px;
        }

        /* Map controls styling */
        .maplibregl-ctrl-group {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .maplibregl-ctrl button {
          width: 32px;
          height: 32px;
          background-color: white;
        }
      `}</style>
    </div>
  );
};

export default RouteMap;
