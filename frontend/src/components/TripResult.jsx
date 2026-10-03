import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapIcon,
  TruckIcon,
  ClockIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  MapPinIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

import { tripService } from "../services/api";
import RouteMap from "./RouteMap";
import ELDLogViewer from "./ELDLogViewer";
import { exportJson, exportCsv, exportLogPdf } from "../utils/tripExport"; // adjust path if needed

// ---------- config & helpers ----------
const SEGMENT_STYLES = {
  DRIVE: { label: "Driving", Icon: TruckIcon, rail: "border-blue-600", chip: "bg-blue-100 text-blue-700" },
  REST: { label: "Rest", Icon: ClockIcon, rail: "border-amber-500", chip: "bg-amber-100 text-amber-700" },
  FUEL: { label: "Fuel stop", Icon: MapPinIcon, rail: "border-emerald-600", chip: "bg-emerald-100 text-emerald-700" },
  PICKUP: { label: "Pickup", Icon: MapPinIcon, rail: "border-violet-600", chip: "bg-violet-100 text-violet-700" },
  DROPOFF: { label: "Dropoff", Icon: MapPinIcon, rail: "border-red-600", chip: "bg-red-100 text-red-700" },
};
const FALLBACK_STYLE = { label: "Stop", Icon: MapPinIcon, rail: "border-slate-400", chip: "bg-slate-100 text-slate-600" };

const fmtHours = (hours) => {
  const mins = Math.round((hours || 0) * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
};

const fmtDay = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
};

const fmtEta = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

// ---------- small components ----------
/** Accessible tabs: roving tabindex, arrow/Home/End keys. */
const Tabs = ({ label, tabs, value, onChange, variant = "main", idPrefix }) => {
  const refs = useRef([]);
  const onKeyDown = (e, i) => {
    const last = tabs.length - 1;
    const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
    if (next == null) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto">
      {tabs.map((t, i) => {
        const active = t.id === value;
        const styles =
          variant === "main"
            ? active
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
            : active
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200";
        return (
          <button
            key={t.id}
            ref={(el) => (refs.current[i] = el)}
            role="tab"
            id={`${idPrefix}-tab-${t.id}`}
            aria-selected={active}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors ${focusRing} ${variant === "main" ? `border-b-2 px-4 py-3 ${styles}` : `rounded-full px-3.5 py-1.5 ${styles}`
              }`}
          >
            {t.Icon && <t.Icon className="h-4 w-4" aria-hidden="true" />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

const ExportButton = ({ children, onClick, busy, disabled, primary }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || busy}
    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusRing} ${primary
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
  >
    <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
    {busy ? "Preparing" : children}
  </button>
);

const Stat = ({ label, value }) => (
  <div className="px-5 py-4">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</dd>
  </div>
);

const PageState = ({ icon: Icon, title, text, children, busy }) => (
  <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div className="max-w-md text-center" role={busy ? "status" : "alert"}>
      {busy ? (
        <div className="mx-auto h-10 w-10 rounded-full border-4 border-slate-200 border-t-blue-600 motion-safe:animate-spin" />
      ) : (
        <Icon className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
      )}
      <h1 className="mt-4 text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-600">{text}</p>
      {children}
    </div>
  </main>
);

const SegmentRow = ({ segment }) => {
  const s = SEGMENT_STYLES[segment.segment_type] ?? { ...FALLBACK_STYLE, label: segment.segment_type || "Stop" };
  const eta = segment.end_time ? fmtEta(segment.end_time) : null;
  return (
    <li className={`rounded-xl border border-slate-200 border-l-4 ${s.rail} bg-white p-4`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <s.Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
          <div className="min-w-0">
            <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${s.chip}`}>{s.label}</span>
            <p className="mt-1.5 text-sm font-medium text-slate-900">
              {segment.start_location}
              <span className="mx-1.5 text-slate-400" aria-label="to">
                →
              </span>
              {segment.end_location}
            </p>
          </div>
        </div>
        <dl className="flex gap-6 pl-8 text-sm md:pl-0">
          <div>
            <dt className="text-slate-500">Distance</dt>
            <dd className="font-semibold tabular-nums">{Math.round(segment.distance_miles || 0)} mi</dd>
          </div>
          <div>
            <dt className="text-slate-500">Duration</dt>
            <dd className="font-semibold tabular-nums">{fmtHours(segment.estimated_duration_hours)}</dd>
          </div>
          {eta && (
            <div>
              <dt className="text-slate-500">Arrive</dt>
              <dd className="font-semibold tabular-nums">{eta}</dd>
            </div>
          )}
        </dl>
      </div>
    </li>
  );
};

// ---------- page ----------
const TripResult = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("map");
  const [logDate, setLogDate] = useState(null);
  const [exporting, setExporting] = useState(null);
  const [exportError, setExportError] = useState("");

  const load = useCallback(() => {
    let cancelled = false;
    setStatus("loading");
    tripService
      .getTripById(tripId)
      .then((data) => {
        if (cancelled) return;
        setTrip(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err?.response?.data?.error || "We couldn't load this trip. Check your connection and try again.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  useEffect(() => load(), [load]);

  const logs = useMemo(
    () => [...(trip?.eld_logs ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [trip]
  );
  const activeLog = logs.find((l) => l.date === logDate) ?? logs[0];

  const totals = useMemo(() => {
    const segs = trip?.segments ?? [];
    return {
      miles: Math.round(segs.reduce((n, s) => n + (s.distance_miles || 0), 0)),
      hours: segs.reduce((n, s) => n + (s.estimated_duration_hours || 0), 0),
      stops: segs.filter((s) => s.segment_type === "REST" || s.segment_type === "FUEL").length,
    };
  }, [trip]);

  const runExport = async (kind, fn) => {
    if (exporting) return;
    setExporting(kind);
    setExportError("");
    try {
      await fn(trip);
    } catch (err) {
      setExportError(err?.message || "The export failed. Try again.");
    } finally {
      setExporting(null);
    }
  };

  if (status === "loading") {
    return <PageState busy title="Loading your trip" text="Fetching the route and daily logs." />;
  }
  if (status === "error" || !trip) {
    return (
      <PageState icon={ExclamationCircleIcon} title="We couldn't load this trip" text={loadError}>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={load}
            className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 ${focusRing}`}
          >
            Try again
          </button>
          <Link
            to="/"
            className={`rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focusRing}`}
          >
            Plan a new trip
          </Link>
        </div>
      </PageState>
    );
  }

  const tabs = [
    { id: "map", label: "Route map", Icon: MapIcon },
    { id: "segments", label: `Segments (${trip.segments?.length ?? 0})`, Icon: TruckIcon },
    { id: "logs", label: `Daily logs (${logs.length})`, Icon: CalendarDaysIcon },
  ];

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Top bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className={`inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 ${focusRing}`}
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Plan a new trip
          </Link>
          <div className="flex flex-wrap gap-2">
            <ExportButton busy={exporting === "json"} onClick={() => runExport("json", exportJson)}>
              JSON
            </ExportButton>
            <ExportButton busy={exporting === "csv"} onClick={() => runExport("csv", exportCsv)}>
              CSV
            </ExportButton>
            <ExportButton
              primary
              busy={exporting === "pdf"}
              disabled={logs.length === 0}
              onClick={() => runExport("pdf", exportLogPdf)}
            >
              Log sheets (PDF)
            </ExportButton>
          </div>
        </div>

        {exportError && (
          <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {exportError}
          </p>
        )}

        {/* Title: the route itself */}
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Your trip plan</h1>
          <ol className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600">
            {[trip.current_location, trip.pickup_location, trip.dropoff_location].map((place, i) => (
              <li key={i} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden="true" className="h-px w-6 bg-slate-300" />}
                <span className={i === 2 ? "font-medium text-slate-900" : ""}>{place}</span>
              </li>
            ))}
          </ol>
        </header>

        {/* Totals */}
        <dl className="mb-8 grid grid-cols-1 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Stat label="Total distance" value={`${totals.miles.toLocaleString()} mi`} />
          <Stat label="Total time" value={fmtHours(totals.hours)} />
          <Stat label="Rest and fuel stops" value={totals.stops} />
        </dl>

        {/* Tabs */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-2">
            <Tabs label="Trip details" idPrefix="trip" tabs={tabs} value={tab} onChange={setTab} />
          </div>

          <div id="trip-panel" role="tabpanel" aria-labelledby={`trip-tab-${tab}`} className="p-4 sm:p-6">
            {tab === "map" && <RouteMap trip={trip} />}

            {tab === "segments" &&
              (trip.segments?.length ? (
                <ol className="space-y-3">
                  {trip.segments.map((seg, i) => (
                    <SegmentRow key={seg.id ?? i} segment={seg} />
                  ))}
                </ol>
              ) : (
                <p className="py-10 text-center text-slate-500">This trip has no segments yet.</p>
              ))}

            {tab === "logs" &&
              (logs.length ? (
                <div className="space-y-6">
                  <Tabs
                    variant="pill"
                    label="Log dates"
                    idPrefix="log"
                    tabs={logs.map((l) => ({ id: l.date, label: fmtDay(l.date) }))}
                    value={activeLog.date}
                    onChange={setLogDate}
                  />
                  <div id="log-panel" role="tabpanel" aria-labelledby={`log-tab-${activeLog.date}`}>
                    <ELDLogViewer log={{ date: activeLog.date, ...activeLog.log_data }} />
                  </div>
                </div>
              ) : (
                <p className="py-10 text-center text-slate-500">No daily logs were generated for this trip.</p>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default TripResult;