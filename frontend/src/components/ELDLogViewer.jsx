import React, { useState } from "react";
import {
  ClockIcon,
  MapPinIcon,
  TruckIcon,
  BriefcaseIcon,
  MoonIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const ELDLogViewer = ({ log }) => {
  const [hoveredEntry, setHoveredEntry] = useState(null);

  if (!log || !log.log_data) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <ExclamationCircleIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500 font-medium">
          No log data available for this date
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Try selecting a different date or verify data exists
        </p>
      </div>
    );
  }

  const logData = log.log_data;

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

  // Calculate hours by status
  const hoursSummary = logData.hours_summary || {};

  // Calculate total hours
  const totalHours = Object.values(hoursSummary).reduce(
    (sum, hours) => sum + hours,
    0
  );

  // Calculate percentage for each status
  const percentages = {};
  Object.entries(hoursSummary).forEach(([status, hours]) => {
    percentages[status] = totalHours > 0 ? (hours / totalHours) * 100 : 0;
  });

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  const formatDuration = (hours) => {
    const roundedHours = Math.floor(hours);
    const minutes = Math.round((hours - roundedHours) * 60);

    if (roundedHours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${roundedHours}h`;
    } else {
      return `${roundedHours}h ${minutes}m`;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-xl font-bold text-gray-800">ELD Log Summary</h3>
          <p className="text-gray-500 flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {new Date(logData.date).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-medium text-sm flex items-center">
          <ClockIcon className="h-4 w-4 mr-2" />
          Total Hours: {Math.round(totalHours * 10) / 10}h
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([code, config]) => {
          const hours = hoursSummary[code] || 0;
          const percent = percentages[code] || 0;

          return (
            <div
              key={code}
              className={`p-4 bg-${config.bgColor} border border-${config.color}-100 rounded-xl transition-all hover:shadow-md`}
            >
              <div className="flex items-center mb-2">
                <div
                  className={`p-2 rounded-full bg-${config.color}-100 text-${config.color}-600 mr-3`}
                >
                  {config.icon}
                </div>
                <h4 className="font-semibold text-gray-800">{config.label}</h4>
              </div>

              <div className="mt-2">
                <div className="flex justify-between items-end mb-1">
                  <span
                    className={`text-2xl font-bold text-${config.color}-600`}
                  >
                    {Math.round(hours * 10) / 10}h
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(percent)}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`bg-${config.color}-500 h-2 rounded-full`}
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
          <div className="relative w-full min-w-[768px] h-[220px] bg-gray-50 rounded-md p-4 border border-gray-200">
            {/* Time grid lines */}
            {Array.from({ length: 25 }, (_, i) => (
              <div
                key={i}
                className="absolute border-l border-gray-200"
                style={{
                  left: `${(i / 24) * 100}%`,
                  top: 25,
                  bottom: 0,
                }}
              >
                <span className="absolute top-[-20px] text-xs text-gray-500 transform -translate-x-1/2">
                  {i.toString().padStart(2, "0")}:00
                </span>
              </div>
            ))}

            {/* AM/PM indicators */}
            <div className="absolute top-6 left-[12.5%] text-xs text-gray-400">
              AM
            </div>
            <div className="absolute top-6 left-[37.5%] text-xs text-gray-400">
              Noon
            </div>
            <div className="absolute top-6 left-[62.5%] text-xs text-gray-400">
              PM
            </div>
            <div className="absolute top-6 left-[87.5%] text-xs text-gray-400">
              Night
            </div>

            {/* Status bars with hover effect */}
            {logData.status_timeline &&
              logData.status_timeline.map((entry, index) => {
                const startTime = entry.start_time.split(":");
                const endTime = entry.end_time.split(":");

                const startPercent =
                  ((parseInt(startTime[0]) * 60 + parseInt(startTime[1])) /
                    (24 * 60)) *
                  100;
                const endPercent =
                  ((parseInt(endTime[0]) * 60 + parseInt(endTime[1])) /
                    (24 * 60)) *
                  100;
                const widthPercent = endPercent - startPercent;
                const config = statusConfig[entry.status];

                const duration =
                  parseInt(endTime[0]) * 60 +
                  parseInt(endTime[1]) -
                  (parseInt(startTime[0]) * 60 + parseInt(startTime[1]));
                const durationHours = Math.round((duration / 60) * 10) / 10;

                return (
                  <div
                    key={index}
                    className={`absolute cursor-pointer rounded-md transition-all duration-150 border border-${config.color}-600`}
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                      height: "60px",
                      top: "60px",
                      backgroundColor: `var(--tw-${config.color}-500)`,
                      opacity: hoveredEntry === index ? 1 : 0.8,
                      transform:
                        hoveredEntry === index ? "scale(1.03)" : "scale(1)",
                      zIndex: hoveredEntry === index ? 20 : 10,
                    }}
                    onMouseEnter={() => setHoveredEntry(index)}
                    onMouseLeave={() => setHoveredEntry(null)}
                  >
                    {widthPercent > 5 && (
                      <div className="h-full flex flex-col justify-center px-2">
                        <p className="text-white text-xs font-medium truncate">
                          {config.label}
                        </p>
                        {widthPercent > 10 && (
                          <p className="text-white text-xs opacity-75 truncate">
                            {formatTime(entry.start_time)} -{" "}
                            {formatTime(entry.end_time)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tooltip on hover */}
                    {hoveredEntry === index && (
                      <div className="absolute left-1/2 transform -translate-x-1/2 -top-24 z-50 bg-gray-800 text-white rounded-lg p-3 shadow-lg text-sm w-52">
                        <div className="font-bold mb-1">{config.label}</div>
                        <div className="grid grid-cols-2 gap-1 mb-2">
                          <div>
                            <span className="text-gray-300">Start:</span>
                            <div className="font-medium">
                              {formatTime(entry.start_time)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-300">End:</span>
                            <div className="font-medium">
                              {formatTime(entry.end_time)}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1 text-gray-300" />
                            <span>{formatDuration(durationHours)}</span>
                          </div>
                          {entry.location && (
                            <div className="flex items-center text-xs text-gray-300">
                              <MapPinIcon className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-[100px]">
                                {entry.location}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-800"></div>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Legend */}
            <div className="absolute bottom-4 right-4 flex items-center space-x-3">
              {Object.entries(statusConfig).map(([code, config]) => (
                <div key={code} className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-sm bg-${config.color}-500 mr-1`}
                  ></div>
                  <span className="text-xs text-gray-500">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Log */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="font-semibold text-gray-800">Detailed Activity Log</h4>
        </div>

        <div className="divide-y divide-gray-100">
          {logData.status_timeline && logData.status_timeline.length > 0 ? (
            logData.status_timeline.map((entry, index) => {
              const config = statusConfig[entry.status];
              const startTime = entry.start_time.split(":");
              const endTime = entry.end_time.split(":");

              const duration =
                parseInt(endTime[0]) * 60 +
                parseInt(endTime[1]) -
                (parseInt(startTime[0]) * 60 + parseInt(startTime[1]));
              const durationHours = duration / 60;

              return (
                <div
                  key={index}
                  className={`p-4 hover:bg-${config.bgColor} transition-colors duration-150`}
                >
                  <div className="flex items-start md:items-center flex-col md:flex-row md:justify-between">
                    <div className="flex items-center mb-2 md:mb-0">
                      <div
                        className={`p-2 rounded-full bg-${config.color}-100 text-${config.color}-600 mr-3`}
                      >
                        {config.icon}
                      </div>
                      <div>
                        <h5
                          className={`font-semibold text-${config.color}-700`}
                        >
                          {config.label}
                        </h5>
                        <p className="text-sm text-gray-500">
                          {formatTime(entry.start_time)} -{" "}
                          {formatTime(entry.end_time)}
                          <span className="mx-2">•</span>
                          {formatDuration(durationHours)}
                        </p>
                      </div>
                    </div>

                    {entry.location && (
                      <div className="flex items-center text-sm text-gray-600 ml-10 md:ml-0">
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
            <div className="p-8 text-center text-gray-500">
              <p>No detailed log entries available for this date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component for the calendar icon
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
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

export default ELDLogViewer;
