import React, { useState } from "react";
import {
  ClockIcon,
  MapPinIcon,
  TruckIcon,
  BriefcaseIcon,
  MoonIcon,
  ExclamationCircleIcon,
  // Assuming CalendarIcon is needed if not imported elsewhere
  // CalendarIcon as HeroCalendarIcon // Alias if needed
} from "@heroicons/react/24/outline";

// Helper component for the calendar icon if not imported elsewhere
const CalendarIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {" "}
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>{" "}
    <line x1="16" y1="2" x2="16" y2="6"></line>{" "}
    <line x1="8" y1="2" x2="8" y2="6"></line>{" "}
    <line x1="3" y1="10" x2="21" y2="10"></line>{" "}
  </svg>
);

const ELDLogViewer = ({ log }) => {
  // log prop IS the data object { date, timeline, summary }
  const [hoveredEntry, setHoveredEntry] = useState(null);

  // --- CORRECTED CHECK ---
  // Check if log exists and has the necessary timeline data
  if (!log || !log.status_timeline || !Array.isArray(log.status_timeline)) {
    // Also good to check log.date and log.hours_summary if they are essential
    // if (!log || !log.date || !log.hours_summary || !log.status_timeline || !Array.isArray(log.status_timeline)) {
    console.warn("ELDLogViewer received invalid or incomplete log prop:", log); // Log for debugging
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <ExclamationCircleIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500 font-medium">
          No valid log data available for this date
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Try selecting a different date or ensure data has timeline/summary.
        </p>
      </div>
    );
  }
  // --- END CORRECTED CHECK ---

  // --- REMOVED UNNECESSARY logData variable ---
  // const logData = log.log_data; // REMOVE THIS

  // --- Use 'log' directly from now on ---

  const statusConfig = {
    D: {
      color: "blue",
      bgColor: "blue-50",
      icon: <TruckIcon className="h-5 w-5" />,
      label: "Driving",
      description: "Time spent operating the vehicle",
    },
    ON: {
      color: "green",
      bgColor: "green-50",
      icon: <BriefcaseIcon className="h-5 w-5" />,
      label: "On Duty (Not Driving)",
      description: "Working but not driving",
    },
    OFF: {
      color: "gray",
      bgColor: "gray-50",
      icon: <ClockIcon className="h-5 w-5" />,
      label: "Off Duty",
      description: "Not working or driving",
    },
    SB: {
      color: "amber",
      bgColor: "amber-50",
      icon: <MoonIcon className="h-5 w-5" />,
      label: "Sleeper Berth",
      description: "Rest period in sleeper berth",
    },
  };

  // Calculate hours by status from log.hours_summary
  const hoursSummary = log.hours_summary || {};

  // Calculate total hours
  const totalHours = Object.values(hoursSummary).reduce(
    (sum, hours) => sum + (hours || 0),
    0
  ); // Add safety for null/undefined hours

  // Calculate percentage for each status
  const percentages = {};
  Object.entries(hoursSummary).forEach(([status, hours]) => {
    percentages[status] =
      totalHours > 0 ? ((hours || 0) / totalHours) * 100 : 0;
  });

  // Helper function to safely format time string HH:MM
  const formatTime = (timeString) => {
    if (!timeString || !timeString.includes(":")) return "--:--"; // Handle invalid input
    const [hours, minutes] = timeString.split(":");
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`; // Ensure padding
  };

  // Helper function to format duration in hours to "Xh Ym"
  const formatDuration = (hours) => {
    if (hours == null || isNaN(hours)) return "0m"; // Handle invalid input
    const totalMinutes = Math.round(hours * 60);
    const roundedHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let parts = [];
    if (roundedHours > 0) {
      parts.push(`${roundedHours}h`);
    }
    if (minutes > 0 || roundedHours === 0) {
      parts.push(`${minutes}m`);
    } // Show minutes if hours is 0 or minutes > 0

    return parts.length > 0 ? parts.join(" ") : "0m";
  };

  // Helper function to parse date string safely, assuming YYYY-MM-DD format from backend
  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    // Add time and Z to ensure UTC parsing, preventing timezone shifts
    const dateStr = dateString.includes("T")
      ? dateString
      : dateString + "T00:00:00Z";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid Date"; // Check if date is valid
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC", // Specify UTC
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-xl font-bold text-gray-800">ELD Log Summary</h3>
          {/* Use log.date */}
          <p className="text-gray-500 flex items-center text-sm sm:text-base">
            <CalendarIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
            {formatDate(log.date)}
          </p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-medium text-sm flex items-center flex-shrink-0">
          <ClockIcon className="h-4 w-4 mr-2" />
          Total Hours: {totalHours.toFixed(1)}h
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([code, config]) => {
          const hours = hoursSummary[code] || 0;
          const percent = percentages[code] || 0;
          // Ensure dynamic Tailwind classes are generated if using JIT/Purge
          const bgColor = `bg-${config.color}-50`;
          const borderColor = `border-${config.color}-100`;
          const iconBgColor = `bg-${config.color}-100`;
          const iconTextColor = `text-${config.color}-600`;
          const hoursTextColor = `text-${config.color}-600`;
          const barBgColor = `bg-${config.color}-500`;

          return (
            // Using template literals assuming Tailwind JIT/Safelisting
            <div
              key={code}
              className={`p-4 ${bgColor} border ${borderColor} rounded-xl transition-all hover:shadow-md`}
            >
              <div className="flex items-center mb-2">
                <div
                  className={`p-2 rounded-full ${iconBgColor} ${iconTextColor} mr-3`}
                >
                  {config.icon}
                </div>
                <h4 className="font-semibold text-gray-800">{config.label}</h4>
              </div>
              <div className="mt-2">
                <div className="flex justify-between items-end mb-1">
                  <span className={`text-2xl font-bold ${hoursTextColor}`}>
                    {hours.toFixed(1)}h
                  </span>
                  <span className="text-sm text-gray-500">
                    {percent.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${barBgColor} h-2 rounded-full`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline Visualization */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h4 className="text-lg font-semibold mb-4">Daily Activity Timeline</h4>
        <div className="overflow-x-auto">
          <div className="relative w-full min-w-[768px] h-[180px] sm:h-[220px] bg-gray-50 rounded-md p-4 border border-gray-200">
            {/* Time grid lines */}
            {Array.from({ length: 25 }, (_, i /* ... */) => (
              <div
                key={i}
                className="absolute border-l border-gray-200"
                style={{ left: `${(i / 24) * 100}%`, top: 25, bottom: 0 }}
              >
                {" "}
                <span className="absolute top-[-20px] text-xs text-gray-500 transform -translate-x-1/2">
                  {i.toString().padStart(2, "0")}:00
                </span>{" "}
              </div>
            ))}
            {/* AM/PM indicators */}
            <div className="absolute top-6 left-[12.5%] text-xs text-gray-400">
              AM
            </div>{" "}
            <div className="absolute top-6 left-[37.5%] text-xs text-gray-400">
              Noon
            </div>{" "}
            <div className="absolute top-6 left-[62.5%] text-xs text-gray-400">
              PM
            </div>{" "}
            <div className="absolute top-6 left-[87.5%] text-xs text-gray-400">
              Night
            </div>
            {/* Status bars - use log.status_timeline */}
            {log.status_timeline.map((entry, index) => {
              const config = statusConfig[entry.status] || statusConfig.OFF; // Fallback config
              const startStr = entry.start_time || "00:00";
              const endStr =
                entry.end_time === "23:59"
                  ? "24:00"
                  : entry.end_time || "00:00"; // Treat 23:59 as end for width calculation

              const startTimeParts = startStr.split(":").map(Number);
              const endTimeParts = endStr.split(":").map(Number);

              if (
                startTimeParts.length !== 2 ||
                endTimeParts.length !== 2 ||
                isNaN(startTimeParts[0]) ||
                isNaN(startTimeParts[1]) ||
                isNaN(endTimeParts[0]) ||
                isNaN(endTimeParts[1])
              ) {
                console.error("Invalid time format in timeline entry:", entry);
                return null; // Skip rendering invalid entry
              }

              const startMinutes = startTimeParts[0] * 60 + startTimeParts[1];
              const endMinutes = endTimeParts[0] * 60 + endTimeParts[1];
              const durationMinutes = Math.max(0, endMinutes - startMinutes);

              const startPercent = (startMinutes / (24 * 60)) * 100;
              let widthPercent = (durationMinutes / (24 * 60)) * 100;

              // Clamp width to prevent overflow
              widthPercent = Math.min(widthPercent, 100 - startPercent);
              if (widthPercent < 0) widthPercent = 0; // Ensure non-negative

              // Get color class dynamically
              const barColorClass = `bg-${config.color}-500`;
              const borderColorClass = `border-${config.color}-600`;

              return (
                <div
                  key={index}
                  className={`absolute cursor-pointer rounded-md transition-all duration-150 border ${borderColorClass}`}
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                    height: "60px",
                    top: "60px",
                    backgroundColor: config?.color
                      ? `var(--tw-color-${config.color}-500)`
                      : "#cccccc",
                    opacity: hoveredEntry === index ? 1 : 0.8,
                    transform:
                      hoveredEntry === index ? "scale(1.03)" : "scale(1)",
                    zIndex: hoveredEntry === index ? 20 : 10,
                  }}
                  onMouseEnter={() => setHoveredEntry(index)}
                  onMouseLeave={() => setHoveredEntry(null)}
                  title={`${config.label}: ${formatTime(
                    entry.start_time
                  )} - ${formatTime(entry.end_time)}`} // Basic tooltip
                >
                  {/* Content inside the bar */}
                  {widthPercent > 4 && ( // Only show text if bar is wide enough
                    <div className="h-full flex flex-col justify-center items-center px-1 overflow-hidden">
                      <p className="text-white text-[10px] sm:text-xs font-medium truncate">
                        {config.label}
                      </p>
                      {widthPercent > 8 && (
                        <p className="text-white text-[9px] sm:text-[10px] opacity-80 truncate">
                          {formatTime(entry.start_time)}-
                          {formatTime(entry.end_time)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tooltip - keep as is */}
                  {hoveredEntry === index && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-24 z-50 bg-gray-800 text-white rounded-lg p-3 shadow-lg text-sm w-52">
                      {" "}
                      <div className="font-bold mb-1">{config.label}</div>{" "}
                      <div className="grid grid-cols-2 gap-1 mb-2">
                        {" "}
                        <div>
                          <span className="text-gray-300">Start:</span>
                          <div className="font-medium">
                            {formatTime(entry.start_time)}
                          </div>
                        </div>{" "}
                        <div>
                          <span className="text-gray-300">End:</span>
                          <div className="font-medium">
                            {formatTime(entry.end_time)}
                          </div>
                        </div>{" "}
                      </div>{" "}
                      <div className="flex justify-between items-center">
                        {" "}
                        <div className="flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1 text-gray-300" />
                          <span>{formatDuration(durationMinutes / 60)}</span>
                        </div>{" "}
                        {entry.location && (
                          <div className="flex items-center text-xs text-gray-300">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[100px]">
                              {entry.location}
                            </span>
                          </div>
                        )}{" "}
                      </div>{" "}
                      <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-800"></div>{" "}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Legend - keep as is */}
            <div className="absolute bottom-[-30px] sm:bottom-4 left-0 sm:left-auto sm:right-4 flex items-center space-x-2 sm:space-x-3 flex-wrap">
              {" "}
              {Object.entries(statusConfig).map(([code, config]) => (
                <div key={code} className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-sm bg-${config.color}-500 mr-1`}
                  ></div>
                  <span className="text-xs text-gray-500">{config.label}</span>
                </div>
              ))}{" "}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Log */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="font-semibold text-gray-800">Detailed Activity Log</h4>
        </div>
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {/* Use log.status_timeline */}
          {log.status_timeline && log.status_timeline.length > 0 ? (
            log.status_timeline.map((entry, index) => {
              const config = statusConfig[entry.status] || statusConfig.OFF; // Fallback
              const startTimeStr = entry.start_time || "00:00";
              const endTimeStr = entry.end_time || "00:00";
              const startTimeParts = startTimeStr.split(":").map(Number);
              const endTimeParts = endTimeStr.split(":").map(Number);
              const startMinutes =
                (startTimeParts[0] || 0) * 60 + (startTimeParts[1] || 0);
              const endMinutes =
                (endTimeParts[0] || 0) * 60 + (endTimeParts[1] || 0);
              const durationMinutes = Math.max(0, endMinutes - startMinutes);
              const durationHours = durationMinutes / 60;
              // Dynamic classes (ensure these are generated/safelisted by Tailwind)
              const hoverBg = `hover:bg-${config.color}-50`;
              const iconBg = `bg-${config.color}-100`;
              const iconText = `text-${config.color}-600`;
              const labelText = `text-${config.color}-700`;

              return (
                <div
                  key={index}
                  className={`p-4 ${hoverBg} transition-colors duration-150`}
                >
                  <div className="flex items-start md:items-center flex-col md:flex-row md:justify-between">
                    <div className="flex items-center mb-2 md:mb-0">
                      <div
                        className={`p-2 rounded-full ${iconBg} ${iconText} mr-3`}
                      >
                        {config.icon}
                      </div>
                      <div>
                        <h5 className={`font-semibold ${labelText}`}>
                          {config.label}
                        </h5>
                        <p className="text-sm text-gray-500">
                          {formatTime(startTimeStr)} - {formatTime(endTimeStr)}
                          <span className="mx-2">•</span>
                          {formatDuration(durationHours)}
                        </p>
                      </div>
                    </div>
                    {entry.location && (
                      <div className="flex items-center text-sm text-gray-600 ml-10 md:ml-0 mt-1 md:mt-0">
                        <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span>{entry.location}</span>
                      </div>
                    )}
                  </div>
                  {entry.notes && (
                    <div className="mt-2 ml-12 text-sm text-gray-600">
                      <p>{entry.notes}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-500 italic">
              <p>No detailed log entries available for this date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ELDLogViewer;
