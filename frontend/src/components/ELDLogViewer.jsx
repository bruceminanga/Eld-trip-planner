import React from "react";

const ELDLogViewer = ({ log }) => {
  if (!log || !log.log_data) {
    return <p className="text-gray-500">No log data available</p>;
  }

  const logData = log.log_data;
  const statusColors = {
    D: "text-blue-500 bg-blue-50", // Driving
    ON: "text-green-500 bg-green-50", // On Duty Not Driving
    OFF: "text-gray-500 bg-gray-50", // Off Duty
    SB: "text-orange-500 bg-orange-50", // Sleeper Berth
  };

  const statusLabels = {
    D: "Driving",
    ON: "On Duty (Not Driving)",
    OFF: "Off Duty",
    SB: "Sleeper Berth",
  };

  // Calculate hours by status
  const hoursSummary = logData.hours_summary || {};

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        ELD Log for {new Date(logData.date).toLocaleDateString()}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {Object.entries(statusLabels).map(([code, label]) => (
          <div key={code} className={`p-3 ${statusColors[code]} rounded-md`}>
            <p className={`font-bold ${statusColors[code].split(" ")[0]}`}>
              {label}
            </p>
            <p className="text-xl">
              {hoursSummary[code]
                ? Math.round(hoursSummary[code] * 10) / 10
                : 0}{" "}
              hrs
            </p>
          </div>
        ))}
      </div>

      <hr className="border-gray-200" />

      <div className="overflow-x-auto">
        <div className="relative w-full h-[200px] bg-gray-100 rounded-md p-2">
          {/* Time grid lines */}
          {Array.from({ length: 25 }, (_, i) => (
            <div
              key={i}
              className="absolute border-l border-gray-300"
              style={{
                left: `${(i / 24) * 100}%`,
                top: 0,
                bottom: 0,
                zIndex: 1,
              }}
            >
              <span className="absolute top-[-25px] left-[-10px] text-xs">
                {i.toString().padStart(2, "0")}:00
              </span>
            </div>
          ))}

          {/* Status bars */}
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

              return (
                <div
                  key={index}
                  className="absolute z-10 rounded-sm"
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                    height: "50px",
                    top: "50px",
                    backgroundColor:
                      {
                        D: "#3182CE", // blue
                        ON: "#48BB78", // green
                        OFF: "#718096", // gray
                        SB: "#ED8936", // orange
                      }[entry.status] || "#718096",
                  }}
                >
                  {widthPercent > 5 && (
                    <p className="text-white text-xs p-1 truncate">
                      {statusLabels[entry.status]}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      <hr className="border-gray-200" />

      <div className="space-y-2">
        <h4 className="text-base font-semibold">Detailed Log</h4>
        {logData.status_timeline &&
          logData.status_timeline.map((entry, index) => (
            <div key={index} className="p-3 border rounded-md">
              <div className="flex justify-between mb-1">
                <p
                  className={`font-bold ${
                    statusColors[entry.status].split(" ")[0]
                  }`}
                >
                  {statusLabels[entry.status]}
                </p>
                <p className="text-sm text-gray-600">
                  {entry.start_time} - {entry.end_time}
                </p>
              </div>
              <p className="text-sm">Location: {entry.location}</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ELDLogViewer;
