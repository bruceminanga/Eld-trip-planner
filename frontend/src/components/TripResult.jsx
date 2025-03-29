import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import RouteMap from "./RouteMap";
import ELDLogViewer from "./ELDLogViewer";

// --- PDF Generation Imports ---
import jsPDF from "jspdf";
// import autoTable from 'jspdf-autotable'; // Not needed for log sheet

import {
  MapIcon,
  TruckIcon,
  ClockIcon,
  CalendarIcon as HeroCalendarIcon,
  DocumentIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  MapPinIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = "/api";

// --- PDF Generation Helper Functions ---

const timeToMinutes = (timeString = "00:00") => {
  /* ... same ... */ try {
    const [hours, minutes] = timeString.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    if (hours === 24 && minutes === 0) return 24 * 60;
    return hours * 60 + minutes;
  } catch {
    return 0;
  }
};

// Draw the static log sheet structure - REFINED VERSION
const drawLogSheetStructure = (doc, dateStr) => {
  const pageHeight = doc.internal.pageSize.height; // mm
  const pageWidth = doc.internal.pageSize.width; // mm - Letter approx 215.9
  const margin = 20; // mm
  const contentWidth = pageWidth - 2 * margin; // Available width
  let y = margin;

  // --- Header Section ---
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Driver's Daily Log", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text("(24 hours)", pageWidth / 2, y, { align: "center" });
  y += 6;

  // Date Fields - Adjusted spacing
  const dateFieldStartX = margin + 12;
  const dateParts = dateStr ? dateStr.split("-") : ["____", "__", "__"];
  const month = dateParts[1] || "__";
  const day = dateParts[2] || "__";
  const year = dateParts[0] || "____";
  doc.text(`Date:`, margin, y);
  doc.text(`${month}`, dateFieldStartX + 3, y);
  doc.line(dateFieldStartX + 2, y + 1, dateFieldStartX + 9, y + 1); // Month line
  doc.text(`/`, dateFieldStartX + 10, y);
  doc.text(`${day}`, dateFieldStartX + 12, y);
  doc.line(dateFieldStartX + 11, y + 1, dateFieldStartX + 17, y + 1); // Day line
  doc.text(`/`, dateFieldStartX + 18, y);
  doc.text(`${year}`, dateFieldStartX + 20, y);
  doc.line(dateFieldStartX + 19, y + 1, dateFieldStartX + 30, y + 1); // Year line
  doc.setFontSize(7);
  doc.text("(month)", dateFieldStartX + 3, y + 3);
  doc.text("(day)", dateFieldStartX + 12, y + 3);
  doc.text("(year)", dateFieldStartX + 21, y + 3);
  doc.setFontSize(9);

  // Original/Duplicate Text - Positioned carefully
  const originDupX = pageWidth - margin - 68;
  doc.setFontSize(7);
  doc.text("Original - File at home terminal.", originDupX, y - 4);
  doc.text(
    "Duplicate - Driver retains in his/her possession for 8 days.",
    originDupX,
    y
  );
  doc.setFontSize(9);
  y += 6;

  // From / To - Balanced spacing
  const fromToWidth = (contentWidth - 10) / 2; // Divide remaining width
  doc.text("From:", margin, y);
  doc.line(margin + 12, y + 1, margin + 12 + fromToWidth, y + 1);
  doc.text("To:", margin + 17 + fromToWidth, y);
  doc.line(
    margin + 24 + fromToWidth,
    y + 1,
    margin + 24 + fromToWidth + fromToWidth,
    y + 1
  );
  y += 7;

  // Mileage Boxes - Adjusted spacing
  const mileageBoxWidth = 45;
  const mileageBoxHeight = 8;
  doc.rect(margin, y, mileageBoxWidth, mileageBoxHeight);
  doc.text("Total Miles Driving Today", margin + mileageBoxWidth / 2, y + 5, {
    align: "center",
  });
  doc.rect(margin + mileageBoxWidth + 5, y, mileageBoxWidth, mileageBoxHeight);
  doc.text(
    "Total Mileage Today",
    margin + mileageBoxWidth + 5 + mileageBoxWidth / 2,
    y + 5,
    { align: "center" }
  );
  // Carrier Info Area - Aligned with mileage boxes
  const carrierY = y; // Align top of text with top of boxes
  const carrierX = margin + mileageBoxWidth * 2 + 15;
  const carrierLineWidth = pageWidth - margin - carrierX;
  doc.text("Name of Carrier or Carriers:", carrierX, carrierY + 3); // Lower text slightly
  doc.line(
    carrierX + 45,
    carrierY + 1,
    carrierX + carrierLineWidth,
    carrierY + 1
  );
  doc.text("Main Office Address:", carrierX, carrierY + 8);
  doc.line(
    carrierX + 35,
    carrierY + 9,
    carrierX + carrierLineWidth,
    carrierY + 9
  );
  doc.text("Home Terminal Address:", carrierX, carrierY + 13);
  doc.line(
    carrierX + 40,
    carrierY + 14,
    carrierX + carrierLineWidth,
    carrierY + 14
  );
  y += mileageBoxHeight + 2; // Space below boxes

  // Truck/Trailer Box
  doc.text("Truck/Tractor and Trailer Numbers or", margin, y);
  doc.text("License Plate(s)/State (show each unit)", margin, y + 4);
  doc.rect(margin, y + 6, 90, 10); // Slightly wider box
  y += 18; // Space before grid

  // --- Grid Graph Section ---
  // Adjust the overall margin to provide more space for labels
  // const margin = 20; // Increase this value (was likely 10 or 15)

  // --- Grid Graph Section ---
  const gridStartY = y;
  const gridHeight = 40;
  const rowHeight = gridHeight / 4;
  const totalHoursColWidth = 18;
  const gridWidth = contentWidth - totalHoursColWidth - 2;
  const gridEndX = margin + gridWidth;
  doc.setLineWidth(0.1);
  doc.rect(margin, gridStartY, gridWidth, gridHeight);

  // Duty Status Labels - Modified for better visibility
  const labels = [
    "1. Off Duty",
    "2. Sleeper Berth",
    "3. Driving",
    "4. On Duty (not driving)",
  ];

  // Move labels much further left and increase spacing
  const labelX = margin - 1; // Significantly increased space
  doc.setFontSize(5); // Larger font size
  doc.setFont(undefined, "bold"); // Make text bold for better visibility

  labels.forEach((label, i) => {
    const labelY = gridStartY + rowHeight * i + rowHeight / 2 + 2;
    // Use explicit right alignment with more space
    doc.text(label, labelX, labelY, { align: "right", maxWidth: 50 });

    // Horizontal line separating rows
    if (i < 3) {
      doc.line(
        margin,
        gridStartY + rowHeight * (i + 1),
        gridEndX,
        gridStartY + rowHeight * (i + 1)
      );
    }
  });
  // --- END REPLACEMENT (Option 1) ---

  // Time Labels and Vertical Grid Lines
  const hourWidth = gridWidth / 24;
  doc.setFontSize(7); // Reset font size for time labels (VERY important!)
  const gridHeaderY = gridStartY - 4; // Position time labels above grid
  doc.line(margin, gridStartY, gridEndX, gridStartY); // Top line of the grid box itself

  for (let hour = 0; hour <= 24; hour++) {
    const x = margin + hour * hourWidth;
    const isMajorHour = hour % 3 === 0 || hour === 12 || hour === 24; // Include Mid at end
    const lineYEnd = gridStartY + gridHeight;

    // Main vertical hour line
    doc.setLineWidth(isMajorHour ? 0.2 : 0.1); // Slightly thicker major lines
    doc.setLineDashPattern(isMajorHour ? [] : [0.5, 0.5], 0); // Dashed for minor hours
    doc.line(x, gridStartY, x, lineYEnd); // Grid lines from top to bottom

    // Hour Labels (Mid, Noon, 3, 6, 9) - Centered OVER the line
    let label = "";
    if (hour === 0 || hour === 24) label = "Mid";
    else if (hour === 12) label = "Noon";
    else if (isMajorHour) label = hour % 12 === 0 ? 12 : hour % 12;

    if (label !== "") {
      doc.text(String(label), x, gridHeaderY, { align: "center" });
    }

    // Quarter hour ticks within the grid rows
    if (hour < 24) {
      doc.setLineWidth(0.1);
      doc.setLineDashPattern([0.5, 0.5], 0);
      for (let q = 1; q <= 3; q++) {
        const qx = x + q * (hourWidth / 4);
        for (let r = 0; r < 4; r++) {
          // Draw ticks in each row
          const rowY = gridStartY + rowHeight * r;
          doc.line(qx, rowY + rowHeight - 1.5, qx, rowY + rowHeight); // Short tick up
        }
      }
    }
  }
  doc.setLineDashPattern([], 0); // Reset line dash
  doc.setLineWidth(0.2); // Reset line width

  // Total Hours Section (Labels & Box)
  const totalX = gridEndX + 2;
  doc.setFontSize(7);
  doc.text("Total", totalX + totalHoursColWidth / 2, gridHeaderY, {
    align: "center",
  });
  doc.text("Hours", totalX + totalHoursColWidth / 2, gridHeaderY + 3, {
    align: "center",
  });
  doc.rect(totalX, gridStartY, totalHoursColWidth, gridHeight); // Box for totals
  // Lines for total hours per row - Centered vertically within row space
  for (let i = 0; i < 4; i++) {
    const lineY = gridStartY + rowHeight * i + rowHeight / 2 + 1; // Centered Y
    doc.line(totalX, lineY, totalX + totalHoursColWidth, lineY);
  }
  // Line for overall total (Thicker)
  doc.setLineWidth(0.4);
  doc.line(
    totalX,
    gridStartY + gridHeight + 1,
    totalX + totalHoursColWidth,
    gridStartY + gridHeight + 1
  );
  doc.setLineWidth(0.2);

  // --- Remarks Section ---
  y = gridStartY + gridHeight + 6; // More space below grid
  doc.setFontSize(10);
  doc.text("Remarks", margin, y);
  const remarksHeight = 25; // Reduced height slightly
  doc.rect(margin, y + 2, contentWidth, remarksHeight);
  y += remarksHeight + 4;

  // --- Shipping Docs / Location Section ---
  doc.setFontSize(9);
  const shipX = margin + 95; // Defined X for right column start
  const shipLineWidth = contentWidth - shipX + margin;
  doc.text("Shipping Documents:", margin, y);
  doc.line(margin + 40, y + 1, shipX - 5, y + 1);
  doc.text("DVIR or Manifest No. or", margin, y + 4);
  doc.text("Shipper & Commodity", margin, y + 8);
  doc.line(margin + 40, y + 9, shipX - 5, y + 9);
  y += 12;
  doc.setFontSize(8);
  // Split the long text line
  const locationInstructionLines = doc.splitTextToSize(
    "Enter name of place you reported and where released from work and when and where each change of duty occurred. Use time standard of home terminal.",
    contentWidth
  );
  doc.text(locationInstructionLines, margin, y);
  y += locationInstructionLines.length * 3.5; // Adjust y based on wrapped lines
  doc.line(margin, y, contentWidth + margin, y); // Line for location notes
  y += 4; // Space before recap

  // --- Recap Section ---
  doc.setFontSize(9);
  doc.text("Recap: Complete at end of day", margin, y);
  const recapY = y + 6;
  const recapCol0W = 35;
  const recapCol1 = margin + recapCol0W;
  const recapColW = 50; // Width for 70/8 and 60/7 columns
  const recapCol2 = recapCol1 + recapColW + 5;
  const recapCol3 = recapCol2 + recapColW + 5;

  doc.setFontSize(8);
  // Col 0
  doc.text("On duty hours", margin, recapY + 3);
  doc.text("today. Total", margin, recapY + 6);
  doc.text("lines 3 & 4", margin, recapY + 9);
  doc.line(recapCol1 - 8, recapY + 10, recapCol1 - 2, recapY + 10); // Line for total

  // Col 1 (70/8)
  doc.text("70 Hour / 8 Day", recapCol1, recapY);
  doc.text("A. Total hrs on duty last 7", recapCol1, recapY + 6);
  doc.text("   days including today.", recapCol1, recapY + 9);
  doc.line(
    recapCol1 + recapColW - 8,
    recapY + 10,
    recapCol1 + recapColW - 2,
    recapY + 10
  ); // Line A
  doc.text("B. Total hours available", recapCol1, recapY + 15);
  doc.text("   tomorrow (70 hr. - A*)", recapCol1, recapY + 18);
  doc.line(
    recapCol1 + recapColW - 8,
    recapY + 19,
    recapCol1 + recapColW - 2,
    recapY + 19
  ); // Line B

  // Col 2 (60/7)
  doc.text("60 Hour / 7 Day", recapCol2, recapY);
  doc.text("A. Total hrs on duty last 6", recapCol2, recapY + 6);
  doc.text("   days including today.", recapCol2, recapY + 9);
  doc.line(
    recapCol2 + recapColW - 8,
    recapY + 10,
    recapCol2 + recapColW - 2,
    recapY + 10
  ); // Line A
  doc.text("B. Total hours available", recapCol2, recapY + 15);
  doc.text("   tomorrow (60 hr. - A*)", recapCol2, recapY + 18);
  doc.line(
    recapCol2 + recapColW - 8,
    recapY + 19,
    recapCol2 + recapColW - 2,
    recapY + 19
  ); // Line B

  // Col 3 (Recap note)
  doc.text("*If you took 34", recapCol3, recapY);
  doc.text("consecutive", recapCol3, recapY + 3);
  doc.text("hours off duty", recapCol3, recapY + 6);
  doc.text("you have 60/70", recapCol3, recapY + 9);
  doc.text("hours available", recapCol3, recapY + 12);

  // Return grid parameters needed for drawing lines/filling totals
  return { gridStartY, gridWidth, gridHeight, rowHeight, margin, contentWidth };
};

// Draw the actual status lines onto the grid (Should be okay, maybe adjust line weight)
const drawStatusLines = (doc, gridParams, timeline) => {
  const { gridStartY, gridWidth, rowHeight, margin } = gridParams;
  const gridEndY = gridStartY + gridParams.gridHeight; // Use gridHeight from params
  const minutesInDay = 24 * 60;
  const statusMap = { OFF: 0, SB: 1, D: 2, ON: 3 };

  doc.setLineWidth(0.5); // Slightly thinner status line
  doc.setLineCap("butt");
  if (!timeline) return;

  for (const entry of timeline) {
    const status = entry.status;
    const startMinutes = timeToMinutes(entry.start_time);
    const endMinutes =
      entry.end_time === "23:59" ? minutesInDay : timeToMinutes(entry.end_time);
    const clampedStartMin = Math.max(0, Math.min(minutesInDay, startMinutes));
    const clampedEndMin = Math.max(0, Math.min(minutesInDay, endMinutes));

    if (clampedEndMin <= clampedStartMin) continue;
    const startX = margin + (clampedStartMin / minutesInDay) * gridWidth;
    const endX = margin + (clampedEndMin / minutesInDay) * gridWidth;
    const rowIndex = statusMap[status];

    if (rowIndex === undefined) continue;
    const y = gridStartY + rowIndex * rowHeight + rowHeight / 2; // Center Y

    // Draw Horizontal Line
    doc.line(startX, y, endX, y);

    // Draw Vertical Line at status change start
    if (startX > margin) {
      doc.setLineWidth(0.1);
      doc.line(startX, gridStartY, startX, gridEndY);
      doc.setLineWidth(0.5); // Reset for next horizontal
    }
  }
  doc.setLineWidth(0.2); // Reset default
};

// Fill in the total hours section - Adjusted positioning
const fillTotalHours = (doc, gridParams, hoursSummary = {}) => {
  const { gridStartY, gridWidth, gridHeight, rowHeight, margin, contentWidth } =
    gridParams;
  const totalHoursColWidth = contentWidth - gridWidth - 2;
  const totalX = margin + gridWidth + 2;
  const textX = totalX + totalHoursColWidth / 2; // Center text in column

  doc.setFontSize(9); // Slightly larger font for totals
  doc.text(
    (hoursSummary.OFF ?? 0).toFixed(1),
    textX,
    gridStartY + rowHeight * 0 + rowHeight / 2 + 1.5,
    { align: "center" }
  );
  doc.text(
    (hoursSummary.SB ?? 0).toFixed(1),
    textX,
    gridStartY + rowHeight * 1 + rowHeight / 2 + 1.5,
    { align: "center" }
  );
  doc.text(
    (hoursSummary.D ?? 0).toFixed(1),
    textX,
    gridStartY + rowHeight * 2 + rowHeight / 2 + 1.5,
    { align: "center" }
  );
  doc.text(
    (hoursSummary.ON ?? 0).toFixed(1),
    textX,
    gridStartY + rowHeight * 3 + rowHeight / 2 + 1.5,
    { align: "center" }
  );

  const totalDayHours =
    (hoursSummary.OFF ?? 0) +
    (hoursSummary.SB ?? 0) +
    (hoursSummary.D ?? 0) +
    (hoursSummary.ON ?? 0);
  doc.setFont(undefined, "bold"); // Bold total
  doc.text(totalDayHours.toFixed(1), textX, gridStartY + gridHeight + 3, {
    align: "center",
  }); // Below total line
  doc.setFont(undefined, "normal"); // Reset font
};

// --- Other Helper Functions (formatDateForPDF etc. - keep as is) ---
const formatDateTimeForPDF = (isoString) => {
  /* ... */ if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return isoString;
  }
};
const formatDateForPDF = (isoString) => {
  /* ... */ if (!isoString) return "N/A";
  const dateStr = isoString.includes("T")
    ? isoString
    : isoString + "T00:00:00Z";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch (e) {
    return isoString;
  }
};

// --- Component Starts Here ---
const TripResult = () => {
  // ... (state variables: trip, loading, error, activeLogTab, activeTab, isExporting - same) ...
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLogTab, setActiveLogTab] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    /* ... fetch data ... */
    const fetchTripData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/`);
        console.log("Fetched Trip Data:", response.data);
        setTrip(response.data);
      } catch (err) {
        console.error(
          "Error fetching trip data:",
          err.response?.data || err.message || err
        );
        setError(
          err.response?.data?.error ||
            "Failed to load trip data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchTripData();
  }, [tripId]);

  // Export Function using updated PDF logic
  const handleExport = async (format = "json") => {
    if (!trip || isExporting) {
      return;
    }
    setIsExporting(true);
    console.log(`Starting export process for format: ${format}`);
    const baseFilename = `trip-${trip.id || "details"}`;
    try {
      if (format === "json") {
        /* ... JSON export ... */
        const dataStr = JSON.stringify(trip, null, 2);
        triggerDownload(dataStr, baseFilename + ".json", "application/json");
      } else if (format === "csv") {
        /* ... CSV export ... */
        const headers = [
          "Segment ID",
          "Type",
          "Start Location",
          "End Location",
          "Distance (miles)",
          "Duration (hours)",
          "Start Time",
          "End Time",
          "Start Lon",
          "Start Lat",
          "End Lon",
          "End Lat",
        ];
        const rows =
          trip.segments?.map((seg) =>
            [
              seg.id,
              seg.segment_type,
              `"${seg.start_location?.replace(/"/g, '""') || ""}"`,
              `"${seg.end_location?.replace(/"/g, '""') || ""}"`,
              seg.distance_miles ?? "",
              seg.estimated_duration_hours ?? "",
              seg.start_time ?? "",
              seg.end_time ?? "",
              seg.start_coordinates?.[0] ?? "",
              seg.start_coordinates?.[1] ?? "",
              seg.end_coordinates?.[0] ?? "",
              seg.end_coordinates?.[1] ?? "",
            ].join(",")
          ) || [];
        const dataStr = [headers.join(","), ...rows].join("\n");
        triggerDownload(
          dataStr,
          baseFilename + "_segments.csv",
          "text/csv;charset=utf-8;"
        );
      } else if (format === "pdf") {
        // Generate Log Sheet PDF
        console.log("Generating Log Sheet PDF...");
        if (!trip.eld_logs || trip.eld_logs.length === 0) {
          throw new Error("No ELD log data available to generate PDF.");
        }
        // Use 'letter' format and 'portrait'
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "letter",
        });
        const sortedLogs = [...trip.eld_logs].sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        sortedLogs.forEach((logEntry, index) => {
          if (index > 0) {
            doc.addPage("letter", "portrait");
          }
          const logDate = logEntry.date;
          const logData = logEntry.log_data;
          if (!logData || !logData.status_timeline || !logData.hours_summary) {
            console.warn(
              `Skipping PDF page for date ${logDate}: Missing data.`
            );
            doc.text(`Log data missing for ${logDate}`, 10, 10);
            return;
          }

          // 1. Draw Static Structure
          const gridParams = drawLogSheetStructure(doc, logDate);

          // 2. Draw Status Lines
          drawStatusLines(doc, gridParams, logData.status_timeline);

          // 3. Fill Total Hours
          fillTotalHours(doc, gridParams, logData.hours_summary);

          // 4. Add Remarks/Locations - Refined
          const remarksStartY =
            gridParams.gridStartY + gridParams.gridHeight + 6; // Y below grid
          const remarksBoxY = remarksStartY + 5; // Top of text box area
          const remarksBoxHeight = 25; // Available height
          doc.setFontSize(8);
          doc.text(
            "Location Changes/Remarks:",
            gridParams.margin + 1,
            remarksStartY + 4
          );
          let lineCount = 0;
          const maxRemarkLines = Math.floor((remarksBoxHeight - 2) / 3.5); // Estimate max lines

          logData.status_timeline.forEach((entry) => {
            if (
              lineCount < maxRemarkLines &&
              entry.location &&
              entry.status !== "OFF"
            ) {
              // Often only log non-OFF locations
              const timeStr = entry.start_time || "??:??";
              const statusStr = entry.status || "??";
              const locStr = entry.location || "N/A";
              // Keep remarks concise
              const remarkLine = `${timeStr} - Stat ${statusStr} @ ${locStr}`;
              const splitLines = doc.splitTextToSize(
                remarkLine,
                gridParams.contentWidth - 2
              );
              splitLines.forEach((line) => {
                if (lineCount < maxRemarkLines) {
                  doc.text(
                    line,
                    gridParams.margin + 1,
                    remarksBoxY + 2 + lineCount * 3.5
                  );
                  lineCount++;
                }
              });
            }
          });
          // Add Page Number
          const pageHeight = doc.internal.pageSize.height;
          const pageWidth = doc.internal.pageSize.width;
          doc.setFontSize(8);
          doc.text(
            `Page ${index + 1} of ${sortedLogs.length}`,
            pageWidth - gridParams.margin,
            pageHeight - gridParams.margin + 5,
            { align: "right" }
          );
        }); // End loop through logs
        doc.save(baseFilename + "_logsheets.pdf");
        console.log("Log Sheet PDF generation complete.");
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }
      console.log(`Export finished for ${format}.`);
    } catch (error) {
      console.error("Export failed:", error);
      alert(`Export failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Trigger Download Helper (keep as is)
  const triggerDownload = (dataStr, filename, mimeType) => {
    /* ... */ const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // getSegmentStyles (keep as is)
  const getSegmentStyles = (type) => {
    /* ... */ switch (type) {
      case "DRIVE":
        return {
          icon: <TruckIcon className="h-5 w-5" />,
          color: "blue",
          label: "Driving",
        };
      case "REST":
        return {
          icon: <ClockIcon className="h-5 w-5" />,
          color: "amber",
          label: "Rest",
        };
      case "FUEL":
        return {
          icon: <MapPinIcon className="h-5 w-5" />,
          color: "green",
          label: "Fuel Stop",
        };
      case "PICKUP":
        return {
          icon: <MapPinIcon className="h-5 w-5" />,
          color: "purple",
          label: "Pickup",
        };
      case "DROPOFF":
        return {
          icon: <MapPinIcon className="h-5 w-5" />,
          color: "red",
          label: "Dropoff",
        };
      default:
        return {
          icon: <MapPinIcon className="h-5 w-5" />,
          color: "gray",
          label: type,
        };
    }
  };

  // Loading State (keep as is)
  if (loading) {
    /* ... loading return ... */ return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        {" "}
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md mx-auto">
          {" "}
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-gray-100"></div>
            <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>{" "}
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Loading Trip Details
          </h2>
          <p className="text-gray-500">
            Please wait while we retrieve your trip information...
          </p>{" "}
        </div>{" "}
      </div>
    );
  }

  // Error State or No Trip Data (keep as is)
  if (error || !trip) {
    /* ... error return ... */ return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        {" "}
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md mx-auto">
          {" "}
          <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />{" "}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Error Loading Trip
          </h2>{" "}
          <p className="text-gray-600 mb-6">
            {error || "Trip data could not be loaded."}
          </p>{" "}
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
          >
            {" "}
            <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to Trip Planner{" "}
          </Link>{" "}
        </div>{" "}
      </div>
    );
  }

  // Group ELD logs (keep as is)
  const eldLogsByDate = {};
  if (trip.eld_logs && trip.eld_logs.length > 0) {
    trip.eld_logs.forEach((log) => {
      eldLogsByDate[log.date] = { date: log.date, log_data: log.log_data };
    });
  }

  // Calculate stats (keep as is)
  const totalDistance = Math.round(
    trip.segments?.reduce((sum, seg) => sum + (seg.distance_miles || 0), 0) || 0
  );
  const totalDuration =
    Math.round(
      (trip.segments?.reduce(
        (sum, seg) => sum + (seg.estimated_duration_hours || 0),
        0
      ) || 0) * 10
    ) / 10;
  const requiredStops =
    trip.segments?.filter(
      (seg) => seg.segment_type === "REST" || seg.segment_type === "FUEL"
    ).length || 0;

  // Main Render
  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <div className="container mx-auto max-w-7xl py-8 px-4 sm:px-6">
        {/* Header with Export Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          {" "}
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-white border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all shadow-sm"
          >
            {" "}
            <ArrowLeftIcon className="h-5 w-5 mr-2" /> New Trip{" "}
          </Link>{" "}
          <div className="flex flex-wrap gap-2">
            {" "}
            <button
              onClick={() => handleExport("json")}
              disabled={!trip || isExporting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />{" "}
              {isExporting ? "..." : "Export JSON"}{" "}
            </button>{" "}
            <button
              onClick={() => handleExport("csv")}
              disabled={!trip || isExporting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />{" "}
              {isExporting ? "..." : "Export CSV"}{" "}
            </button>{" "}
            <button
              onClick={() => handleExport("pdf")}
              disabled={
                !trip ||
                !trip.eld_logs ||
                trip.eld_logs.length === 0 ||
                isExporting
              }
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                !trip || !trip.eld_logs || trip.eld_logs.length === 0
                  ? "No ELD Log data to export"
                  : "Export Daily Log Sheet PDF"
              }
            >
              {" "}
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />{" "}
              {isExporting ? "..." : "Export Log PDF"}{" "}
            </button>{" "}
          </div>{" "}
        </div>

        {/* Title Section */}
        <div className="text-center mb-10">
          {" "}
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Trip Plan Results
          </h1>{" "}
          <div className="inline-flex items-center bg-white px-4 py-2 rounded-full shadow-sm text-gray-600">
            {" "}
            <span className="font-medium">{trip.current_location}</span>{" "}
            <ArrowRightIcon className="h-4 w-4 mx-2 text-gray-400" />{" "}
            <span className="font-medium">{trip.pickup_location}</span>{" "}
            <ArrowRightIcon className="h-4 w-4 mx-2 text-gray-400" />{" "}
            <span className="font-medium">{trip.dropoff_location}</span>{" "}
          </div>{" "}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {" "}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transform transition-all hover:shadow-md">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <TruckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Distance
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {totalDistance} miles
                </p>
              </div>
            </div>
          </div>{" "}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transform transition-all hover:shadow-md">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Duration
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {totalDuration} hours
                </p>
              </div>
            </div>
          </div>{" "}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transform transition-all hover:shadow-md">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                <MapPinIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Required Stops
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {requiredStops}
                </p>
              </div>
            </div>
          </div>{" "}
        </div>

        {/* Main Content (Tabs) */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Tabs Navigation */}
          <div className="flex border-b overflow-x-auto">
            <button
              className={`flex items-center px-4 sm:px-6 py-4 transition-colors whitespace-nowrap ${
                activeTab === 0
                  ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab(0)}
            >
              <MapIcon className="h-5 w-5 mr-2" />
              Route Map
            </button>
            <button
              className={`flex items-center px-4 sm:px-6 py-4 transition-colors whitespace-nowrap ${
                activeTab === 1
                  ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab(1)}
            >
              <TruckIcon className="h-5 w-5 mr-2" />
              Trip Segments
            </button>
            <button
              className={`flex items-center px-4 sm:px-6 py-4 transition-colors whitespace-nowrap ${
                activeTab === 2
                  ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab(2)}
            >
              <HeroCalendarIcon className="h-5 w-5 mr-2" />
              ELD Logs
            </button>
          </div>
          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 0 && (
              <div className="rounded-lg overflow-hidden border border-gray-200 shadow-inner">
                {" "}
                {trip && <RouteMap trip={trip} />}{" "}
              </div>
            )}
            {activeTab === 1 && (
              <div className="space-y-4">
                {" "}
                {trip?.segments?.map((segment, index) => {
                  const style = getSegmentStyles(segment.segment_type);
                  const borderColorClass = `border-${style.color}-500`;
                  const bgColorClass = `bg-${style.color}-50`;
                  const textColorClass = `text-${style.color}-600`;
                  const labelBgColorClass = `bg-${style.color}-100`;
                  const labelTextColorClass = `text-${style.color}-700`;
                  return (
                    <div
                      key={index}
                      className={`p-4 sm:p-5 rounded-lg border-l-4 ${borderColorClass} ${bgColorClass} shadow-sm`}
                    >
                      {" "}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {" "}
                        <div className="flex items-center flex-grow min-w-0">
                          {" "}
                          <div
                            className={`mr-3 sm:mr-4 flex-shrink-0 ${textColorClass}`}
                          >
                            {style.icon}
                          </div>{" "}
                          <div className="min-w-0">
                            {" "}
                            <span
                              className={`inline-block px-3 py-1 text-xs font-medium ${labelTextColorClass} ${labelBgColorClass} rounded-full mb-2`}
                            >
                              {style.label}
                            </span>{" "}
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {segment.start_location} → {segment.end_location}
                            </h3>{" "}
                          </div>{" "}
                        </div>{" "}
                        <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 text-sm sm:text-base flex-shrink-0 pl-8 md:pl-0">
                          {" "}
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                              Distance
                            </p>
                            <p className="font-semibold">
                              {Math.round(segment.distance_miles || 0)} mi
                            </p>
                          </div>{" "}
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                              Duration
                            </p>
                            <p className="font-semibold">
                              {Math.round(
                                (segment.estimated_duration_hours || 0) * 10
                              ) / 10}{" "}
                              hr
                            </p>
                          </div>{" "}
                          {segment.end_time && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">
                                ETA
                              </p>
                              <p className="font-semibold">
                                {new Date(segment.end_time).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )}
                              </p>
                            </div>
                          )}{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>
                  );
                })}{" "}
                {(!trip?.segments || trip.segments.length === 0) && (
                  <p className="text-center text-gray-500 italic">
                    No segments generated for this trip.
                  </p>
                )}{" "}
              </div>
            )}
            {activeTab === 2 && (
              <div>
                {" "}
                <div className="flex overflow-x-auto space-x-2 border-b mb-6 pb-2">
                  {" "}
                  {Object.keys(eldLogsByDate).length > 0 ? (
                    Object.keys(eldLogsByDate)
                      .sort()
                      .map((date, index) => (
                        <button
                          key={date}
                          className={`flex items-center px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
                            activeLogTab === index
                              ? "bg-blue-600 text-white font-medium"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                          onClick={() => setActiveLogTab(index)}
                        >
                          {" "}
                          <HeroCalendarIcon className="h-4 w-4 mr-2" />{" "}
                          <span className="text-sm">
                            {formatDateForPDF(date)}
                          </span>{" "}
                        </button>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500 italic px-4 py-2">
                      No ELD logs found for this trip.
                    </p>
                  )}{" "}
                </div>{" "}
                {Object.keys(eldLogsByDate).length > 0 ? (
                  <div className="bg-gray-50 p-4 sm:p-5 rounded-lg">
                    {" "}
                    <ELDLogViewer
                      log={
                        eldLogsByDate[
                          Object.keys(eldLogsByDate).sort()[activeLogTab]
                        ]?.log_data
                      }
                    />{" "}
                  </div>
                ) : null}{" "}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripResult;
