// frontend/src/utils/tripExport.js

export const exportJson = async (trip) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(trip, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `trip_${trip.id || "export"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
};

export const exportCsv = async (trip) => {
    const segments = trip.segments || [];
    const headers = ["Segment Type", "Start", "End", "Miles", "Hours"];
    const rows = segments.map((s) => [
        s.segment_type,
        `"${s.start_location}"`,
        `"${s.end_location}"`,
        s.distance_miles || 0,
        s.estimated_duration_hours || 0,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `trip_${trip.id || "export"}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const exportLogPdf = async (trip) => {
    // Simple print dialog fallback for PDF export
    window.print();
};