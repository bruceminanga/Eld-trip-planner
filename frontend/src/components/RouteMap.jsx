import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// --- IMPORTANT: Replace with YOUR Geoapify API key ---

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

// Segment type configuration for styling consistency
const SEGMENT_CONFIG = {
  START: { color: "#1D4ED8", icon: "S", label: "Start" },
  PICKUP: { color: "#8B5CF6", icon: "P", label: "Pickup" },
  DROPOFF: { color: "#EF4444", icon: "D", label: "Dropoff" },
  FUEL: { color: "#10B981", icon: "F", label: "Fuel Stop" },
  REST: { color: "#F59E0B", icon: "R", label: "Rest Stop" },
  DRIVE: { color: "#3B82F6", icon: "T", label: "Drive Segment" }, // For potential use if needed
  WAYPOINT: { color: "#777777", icon: "W", label: "Waypoint" }, // Fallback for unknown types
  // Add other types returned by your backend if necessary
};

const RouteMap = ({ trip }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Guard against missing trip data early
    if (!trip || !trip.segments || trip.segments.length === 0) {
      setError("No valid trip data provided to display the map.");
      setLoading(false);
      // Cleanup potentially existing map if trip becomes invalid
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      return;
    }

    // Basic check to prevent re-init for the exact same trip object instance
    // More robust checks could involve trip IDs if available and stable
    // if (map.current && map.current._internalTripId === trip.id) {
    //   console.log("Map already initialized for this trip ID. Skipping re-initialization.");
    //   setLoading(false); // Ensure loading is off if we skip
    //   return;
    // }

    // --- Map Initialization ---
    console.log("Initializing map for trip:", trip.id || "(no ID)");
    setLoading(true);
    setError(null);

    // Ensure previous map instance is removed before creating a new one
    // This handles cases where the component re-renders with a *different* trip
    if (map.current) {
      console.log("Removing previous map instance.");
      map.current.remove();
      map.current = null;
    }
    if (!mapContainer.current) {
      console.error("Map container ref is not available.");
      setError("Map container element not found.");
      setLoading(false);
      return; // Should not happen normally
    }

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${GEOAPIFY_API_KEY}`,
        center: [-98, 38], // Default center (US) - will be overridden by fitBounds
        zoom: 3, // Default zoom
        attributionControl: false,
      });
      // Store trip ID internally if available, for potential re-render checks
      // if (trip.id) {
      //   map.current._internalTripId = trip.id;
      // }
    } catch (mapInitError) {
      console.error("Failed to initialize map:", mapInitError);
      setError(`Failed to initialize map library: ${mapInitError.message}`);
      setLoading(false);
      return;
    }

    // Add Controls
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    map.current.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    // --- Map Load Event Handler ---
    map.current.on("load", async () => {
      console.log("Map 'load' event triggered.");
      // Double-check loading state and clear errors
      if (!loading) setLoading(true);
      if (error) setError(null);

      const allPointsForMarkers = []; // Points specifically for placing markers/popups
      const waypointsForRoutingApi = []; // Coordinates [lon, lat] for the routing API

      try {
        // --- 1. Prepare Points from Trip Prop ---
        if (!trip.segments || trip.segments.length === 0) {
          throw new Error("Trip contains no segments.");
        }

        // Extract unique significant locations (start, stops, end) for markers and routing
        trip.segments.forEach((segment, index) => {
          // Validate segment coordinates
          if (
            !segment.start_coordinates ||
            !Array.isArray(segment.start_coordinates) ||
            segment.start_coordinates.length !== 2
          ) {
            console.warn(
              `Segment ${index} ('${segment.start_location}') is missing or has invalid 'start_coordinates'. Skipping related points.`
            );
            return; // Skip this segment if start coords are bad
          }
          if (
            !segment.end_coordinates ||
            !Array.isArray(segment.end_coordinates) ||
            segment.end_coordinates.length !== 2
          ) {
            console.warn(
              `Segment ${index} ('${segment.end_location}') is missing or has invalid 'end_coordinates'. Skipping related points.`
            );
            // Might still use start_coordinates if it's the first segment
            if (index !== 0) return;
          }

          // Add the start point of the *first* segment
          if (index === 0) {
            // Determine type for the first point
            let startType =
              segment.segment_type === "DRIVE" ? "START" : segment.segment_type;
            if (!SEGMENT_CONFIG[startType]) startType = "START"; // Default to START if unknown

            const startPoint = {
              type: startType,
              coordinates: segment.start_coordinates,
              location: segment.start_location || "Trip Start",
            };
            allPointsForMarkers.push(startPoint);
            waypointsForRoutingApi.push(startPoint.coordinates);
          }

          // Add the end point of the segment if it's a significant stop or the final destination
          const isStopType = ["REST", "FUEL", "PICKUP", "DROPOFF"].includes(
            segment.segment_type
          );
          const isLastSegment = index === trip.segments.length - 1;

          if (segment.end_coordinates && (isStopType || isLastSegment)) {
            let endType = segment.segment_type;
            if (!SEGMENT_CONFIG[endType]) endType = "WAYPOINT"; // Fallback

            const endPoint = {
              type: endType,
              coordinates: segment.end_coordinates,
              location: segment.end_location || `Stop/End ${index + 1}`,
            };

            // Avoid adding duplicate *consecutive* coordinates for markers/routing
            const lastApiWaypoint =
              waypointsForRoutingApi[waypointsForRoutingApi.length - 1];
            if (
              !lastApiWaypoint ||
              lastApiWaypoint[0] !== endPoint.coordinates[0] ||
              lastApiWaypoint[1] !== endPoint.coordinates[1]
            ) {
              allPointsForMarkers.push(endPoint);
              waypointsForRoutingApi.push(endPoint.coordinates);
            } else {
              console.log(
                `Skipping duplicate waypoint coordinate at: ${endPoint.location}`
              );
              // Optional: Update the type of the last marker if the current one is more specific (e.g., DROPOFF)
              const lastMarker =
                allPointsForMarkers[allPointsForMarkers.length - 1];
              if (lastMarker && endType === "DROPOFF") {
                // Prioritize Dropoff label
                lastMarker.type = "DROPOFF";
                lastMarker.location = endPoint.location; // Update location name too
              }
            }
          }
        });

        console.log("Points for markers:", allPointsForMarkers);
        console.log("Waypoints for routing API:", waypointsForRoutingApi);

        // --- 2. Add Markers ---
        if (!map.current)
          throw new Error("Map reference lost before adding markers.");
        allPointsForMarkers.forEach((point, index) => {
          const config = SEGMENT_CONFIG[point.type] || SEGMENT_CONFIG.WAYPOINT; // Use fallback
          if (!config) {
            console.warn(
              `No config for marker type: ${point.type}. Skipping marker.`
            );
            return;
          }
          const markerElement = document.createElement("div");
          markerElement.className = "custom-marker";
          markerElement.innerHTML = `
            <div class="marker-dot" style="background-color: ${config.color}">
              <span class="marker-text">${config.icon}</span>
            </div>
            <div class="marker-pulse" style="border-color: ${config.color}"></div>
          `;

          // Use try-catch for individual marker/popup creation for resilience
          try {
            const markerInstance = new maplibregl.Marker({
              element: markerElement,
            })
              .setLngLat(point.coordinates)
              .setPopup(
                new maplibregl.Popup({ offset: 25, closeButton: false })
                  .setHTML(`
                    <div class="popup-content">
                      <h3 style="color: ${config.color}; font-weight: 600; margin-bottom: 5px;">${config.label}</h3>
                      <p style="margin: 0 0 3px; font-size: 14px;">${point.location}</p>
                    </div>`)
              );

            // Stagger marker appearance slightly
            setTimeout(() => {
              if (map.current) {
                // Check map still exists in timeout
                markerInstance.addTo(map.current);
              }
            }, index * 100);
          } catch (markerError) {
            console.error(
              `Failed to create marker/popup for point: ${point.location}`,
              markerError
            );
            // Continue adding other markers
          }
        });

        // --- 3. Fetch SINGLE Driving Route for ALL Waypoints ---
        let routeGeometry = null;
        if (waypointsForRoutingApi.length >= 2) {
          console.log(
            `Fetching route for ${waypointsForRoutingApi.length} waypoints...`
          );
          const waypointsString = waypointsForRoutingApi
            .map((coord) => `${coord[1]},${coord[0]}`) // Format: lat,lon
            .join("|");
          const routingUrl = `https://api.geoapify.com/v1/routing?waypoints=${waypointsString}&mode=drive&details=route_details&apiKey=${GEOAPIFY_API_KEY}`;

          console.log(
            `Routing URL (key redacted): ${routingUrl.replace(
              GEOAPIFY_API_KEY,
              "YOUR_API_KEY"
            )}`
          );

          try {
            const response = await fetch(routingUrl);
            const routeData = await response.json();

            if (!response.ok) {
              console.error("Routing API Error Response:", routeData);
              throw new Error(
                `Routing API error (${response.status} ${
                  response.statusText
                }). ${
                  routeData?.message ||
                  "Check API Key, Account Status, Coordinates, or Console."
                }`
              );
            }

            if (
              routeData.features &&
              routeData.features.length > 0 &&
              routeData.features[0].geometry
            ) {
              routeGeometry = routeData.features[0].geometry; // Expecting LineString or MultiLineString
              console.log("Route fetched successfully.");
            } else {
              console.warn("No route geometry found in API response.");
              // No error thrown, map will just show markers without route line
            }
          } catch (fetchError) {
            console.error("Failed to fetch driving route:", fetchError);
            // Throw to display error message on map
            throw new Error(
              `Failed to fetch driving route. ${fetchError.message}`
            );
          }
        } else {
          console.warn(
            "Not enough waypoints (need at least 2) to fetch a route."
          );
        }

        // --- 4. Add Route Layer to Map ---
        if (map.current && routeGeometry) {
          const routeSourceId = "route-source";
          const routeLayerId = "route-line";
          const routeOutlineLayerId = "route-outline";

          // Combine coordinates if MultiLineString into a single LineString for drawing
          let allRouteCoordinates = [];
          if (routeGeometry.type === "LineString") {
            allRouteCoordinates = routeGeometry.coordinates;
          } else if (routeGeometry.type === "MultiLineString") {
            routeGeometry.coordinates.forEach((line) =>
              allRouteCoordinates.push(...line)
            );
          } else {
            console.warn("Unexpected route geometry type:", routeGeometry.type);
          }

          // Remove potential old layers/source before adding new ones
          if (map.current.getLayer(routeLayerId))
            map.current.removeLayer(routeLayerId);
          if (map.current.getLayer(routeOutlineLayerId))
            map.current.removeLayer(routeOutlineLayerId);
          if (map.current.getSource(routeSourceId))
            map.current.removeSource(routeSourceId);

          if (allRouteCoordinates.length > 0) {
            map.current.addSource(routeSourceId, {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: allRouteCoordinates,
                },
              },
            });

            // Add outline layer (draw first, underneath)
            map.current.addLayer({
              id: routeOutlineLayerId,
              type: "line",
              source: routeSourceId,
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#000000",
                "line-width": 8,
                "line-opacity": 0.2,
                "line-blur": 1, // Soften outline
              },
            });

            // Add main route layer
            map.current.addLayer({
              id: routeLayerId,
              type: "line",
              source: routeSourceId,
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#3B82F6", // Primary route blue
                "line-width": 5,
                "line-opacity": 0.9,
              },
            });
            console.log("Route layers added to map.");
          } else {
            console.warn(
              "Processed route geometry resulted in no coordinates to draw."
            );
          }
        } // End if (map.current && routeGeometry)

        // --- 5. Fit Map to Bounds (using markers and potentially route) ---
        const bounds = new maplibregl.LngLatBounds();
        allPointsForMarkers.forEach((point) => {
          if (point && point.coordinates) bounds.extend(point.coordinates);
        });

        // If route was successfully drawn, extend bounds to include it
        if (map.current && map.current.getSource("route-source")) {
          const routeSource = map.current.getSource("route-source");
          if (
            routeSource &&
            routeSource.type === "geojson" &&
            routeSource._data.geometry?.coordinates
          ) {
            routeSource._data.geometry.coordinates.forEach((coord) =>
              bounds.extend(coord)
            );
          }
        }

        // Add a short delay before fitting bounds to allow markers/route to render
        setTimeout(() => {
          if (!map.current) return; // Check map still exists
          if (!bounds.isEmpty()) {
            console.log("Fitting map to calculated bounds...");
            map.current.fitBounds(bounds, {
              padding: { top: 80, bottom: 100, left: 80, right: 80 }, // Generous padding
              duration: 1200, // Smooth animation
              maxZoom: 16, // Don't zoom in excessively close
            });
          } else {
            console.warn(
              "Bounds are empty after processing points/route. Cannot fit map."
            );
            // Could fall back to default center/zoom if needed, but usually indicates bad data
          }
          setLoading(false); // Hide loading indicator *after* fitting attempt
        }, 300); // Delay after adding layers/markers

        // --- 6. Add/Update Legend ---
        const legendContainerId = "map-legend-container";
        let legendContainer = mapContainer.current?.querySelector(
          `#${legendContainerId}`
        );
        if (legendContainer) legendContainer.remove(); // Remove existing legend

        legendContainer = document.createElement("div");
        legendContainer.id = legendContainerId;
        legendContainer.className = "map-legend";

        const uniqueTypesInTrip = [
          ...new Set(allPointsForMarkers.map((p) => p.type)),
        ];
        const legendItemsHtml = uniqueTypesInTrip
          .map((type) => {
            const config = SEGMENT_CONFIG[type];
            if (!config) return ""; // Skip if type has no config
            return `
                   <div class="legend-item">
                       <span class="legend-color" style="background-color: ${config.color}"></span>
                       <span>${config.label}</span>
                   </div>
               `;
          })
          .join("");

        if (legendItemsHtml && mapContainer.current) {
          legendContainer.innerHTML = `
                 <div class="legend-title">Trip Legend</div>
                 ${legendItemsHtml}
             `;
          mapContainer.current.appendChild(legendContainer);
          console.log("Legend added/updated.");
        }
      } catch (err) {
        // Catch errors from anywhere within the 'load' handler or point processing
        console.error("Error during map processing:", err);
        setError(
          `Failed to display map details: ${err.message}. Check console.`
        );
        // Attempt to fit map to any markers that might have been added before the error
        try {
          if (map.current && allPointsForMarkers.length > 0) {
            const bounds = new maplibregl.LngLatBounds();
            allPointsForMarkers.forEach((point) => {
              if (point && point.coordinates) bounds.extend(point.coordinates);
            });
            if (!bounds.isEmpty()) {
              map.current.fitBounds(bounds, {
                padding: 80,
                maxZoom: 16,
                duration: 500,
              });
            }
          }
        } catch (fitError) {
          console.error(
            "Error trying to fit bounds during error handling:",
            fitError
          );
        }
        setLoading(false); // Ensure loading is turned off on error
      }
    }); // End of map.on('load')

    // Handle general map errors (e.g., style loading failure)
    map.current.on("error", (e) => {
      console.error("MapLibre GL encountered an error:", e);
      // Avoid overwriting a more specific error (like routing failure)
      if (!error) {
        setError(
          `Map error: ${
            e.error?.message || "An unknown map library error occurred"
          }`
        );
      }
      setLoading(false); // Stop loading indicator on map error
    });

    // --- Cleanup Function ---
    return () => {
      console.log("Cleaning up map instance...");
      if (map.current) {
        map.current.remove(); // Fully remove the map instance, sources, layers, listeners
        map.current = null;
      }
      // Optional: Explicitly remove legend if map.remove() doesn't always catch it
      // const legendEl = mapContainer.current?.querySelector('#map-legend-container');
      // if (legendEl) legendEl.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip]); // *** DEPEND ON trip PROP TO RE-RUN WHEN IT CHANGES ***

  // --- Render Component ---
  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-gray-100">
      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-700 font-medium">Loading Map & Route...</p>
        </div>
      )}

      {/* Error Display */}
      {error &&
        !loading && ( // Show error only if not loading
          <div className="absolute inset-0 bg-red-100/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 p-6 text-center">
            <div className="text-4xl mb-3 text-red-600">⚠️</div>
            <p className="text-red-800 font-semibold mb-1">Map Error</p>
            <p className="text-red-700 text-sm max-w-md">{error}</p>
          </div>
        )}

      {/* Map Container Div (Always present) */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full map-container"
      />

      {/* Global Styles (Keep as is from your original) */}
      <style jsx global>{`
        .map-container {
          width: 100%;
          height: 100%;
          background-color: #f3f4f6; /* Light gray fallback background */
        }
        .custom-marker {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
        }
        .marker-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
          position: relative;
          z-index: 1;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        .marker-text {
          color: white;
          font-weight: bold;
          font-size: 13px;
          line-height: 1;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
        .custom-marker:hover .marker-dot {
          transform: scale(1.15);
        }
        .marker-pulse {
          position: absolute;
          top: 0px;
          left: 0px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid;
          transform-origin: center center;
          animation: pulse 2s infinite ease-out;
          opacity: 0;
          z-index: 0;
        }
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.6;
          }
          70% {
            transform: scale(1.4);
            opacity: 0;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        .map-legend {
          position: absolute;
          bottom: 25px;
          left: 15px;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          padding: 10px 15px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          font-size: 12px;
          line-height: 1.4;
          max-width: 180px;
          z-index: 1;
          backdrop-filter: blur(2px);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        .legend-title {
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
          color: #333;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .legend-item:last-child {
          margin-bottom: 0;
        }
        .legend-color {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.1);
          display: inline-block;
          flex-shrink: 0;
        }
        .maplibregl-popup {
          max-width: 220px !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue",
            sans-serif;
        }
        .maplibregl-popup-content {
          padding: 10px 14px;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
          font-size: 13px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(3px);
        }
        .maplibregl-popup-tip {
          display: none;
        }
        .popup-content {
        }
        .maplibregl-ctrl-group {
          border-radius: 8px !important;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2) !important;
        }
        .maplibregl-ctrl button {
          width: 34px !important;
          height: 34px !important;
          background-color: white !important;
          transition: background-color 0.15s ease;
        }
        .maplibregl-ctrl button:hover {
          background-color: #f8f8f8 !important;
        }
        .maplibregl-ctrl button .maplibregl-ctrl-icon {
          height: 20px;
          width: 20px;
        }
        .maplibregl-ctrl-attrib {
          background-color: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(1px);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .maplibregl-ctrl-attrib a {
          color: #3377cc;
        }
      `}</style>
    </div>
  );
};

export default RouteMap;
