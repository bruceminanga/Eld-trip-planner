import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tripService } from "../services/api"; // adjust path if needed

/**
 * TripPlanner
 * The three stops sit on one vertical rail (current -> pickup -> dropoff), so the
 * form reads as the route itself. The cycle field shows hours remaining against
 * the 70-hour limit. All Tailwind classes are static strings.
 */

const CYCLE_LIMIT = 70;

const STOPS = [
  {
    name: "current_location",
    label: "Current location",
    placeholder: "e.g. Denver, CO",
    error: "Enter where you are now",
    autoComplete: "street-address",
  },
  {
    name: "pickup_location",
    label: "Pickup",
    placeholder: "e.g. Salt Lake City, UT",
    error: "Enter the pickup location",
    autoComplete: "off",
  },
  {
    name: "dropoff_location",
    label: "Dropoff",
    placeholder: "e.g. Portland, OR",
    error: "Enter the dropoff location",
    autoComplete: "off",
  },
];

const FIELD_ORDER = [...STOPS.map((s) => s.name), "current_cycle_used"];

const inputBase =
  "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1";

const borderFor = (hasError) => (hasError ? "border-red-500" : "border-slate-300");

const Spinner = () => (
  <svg className="h-5 w-5 motion-safe:animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const FieldError = ({ id, children }) =>
  children ? (
    <p id={id} className="mt-1.5 text-sm text-red-700">
      {children}
    </p>
  ) : null;

// Cycle status drives both the bar colour and the helper text.
const cycleStatus = (used) => {
  const left = CYCLE_LIMIT - used;
  if (left <= 10) return { bar: "bg-red-500", text: "text-red-700", note: "Very little time left in this cycle" };
  if (left <= 30) return { bar: "bg-amber-500", text: "text-amber-700", note: "Plan rest stops carefully" };
  return { bar: "bg-emerald-500", text: "text-emerald-700", note: "Plenty of hours available" };
};

const TripPlanner = () => {
  const [formData, setFormData] = useState({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    current_cycle_used: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name] || errors.form) {
      setErrors((prev) => ({ ...prev, [name]: null, form: null }));
    }
  };

  const validate = () => {
    const next = {};
    STOPS.forEach(({ name, error }) => {
      if (!formData[name].trim()) next[name] = error;
    });

    const raw = formData.current_cycle_used;
    const used = parseFloat(raw);
    if (raw === "" || Number.isNaN(used)) {
      next.current_cycle_used = "Enter the hours used in this cycle";
    } else if (used < 0 || used > CYCLE_LIMIT) {
      next.current_cycle_used = `Enter a number from 0 to ${CYCLE_LIMIT}`;
    }

    setErrors(next);
    const firstBad = FIELD_ORDER.find((n) => next[n]);
    if (firstBad) formRef.current?.elements[firstBad]?.focus();
    return !firstBad;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || !validate()) return;

    setIsLoading(true);
    try {
      const newTrip = await tripService.createTrip({
        current_location: formData.current_location.trim(),
        pickup_location: formData.pickup_location.trim(),
        dropoff_location: formData.dropoff_location.trim(),
        current_cycle_used: parseFloat(formData.current_cycle_used),
      });
      navigate(`/result/${newTrip.id}`);
    } catch (err) {
      setErrors({ form: err?.message || "We couldn't plan this trip. Check your connection and try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const used = parseFloat(formData.current_cycle_used);
  const validUsed = !Number.isNaN(used) && used >= 0 && used <= CYCLE_LIMIT;
  const status = validUsed ? cycleStatus(used) : null;
  const pct = validUsed ? (used / CYCLE_LIMIT) * 100 : 0;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Plan a trip</h1>
          <p className="mt-2 text-slate-600">
            Enter your stops and cycle hours. We'll build the route and your daily logs, with required breaks included.
          </p>
        </header>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
        >
          {errors.form && (
            <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errors.form}
            </div>
          )}

          {/* Route rail */}
          <ol className="relative space-y-6">
            <span
              aria-hidden="true"
              className="absolute bottom-8 left-[11px] top-8 w-px border-l-2 border-dashed border-slate-300"
            />
            {STOPS.map((stop, i) => {
              const err = errors[stop.name];
              const isLast = i === STOPS.length - 1;
              return (
                <li key={stop.name} className="relative flex gap-4">
                  <span
                    aria-hidden="true"
                    className={`relative z-10 mt-8 h-6 w-6 shrink-0 rounded-full border-4 border-white ring-2 ${isLast ? "bg-blue-600 ring-blue-600" : i === 0 ? "bg-slate-400 ring-slate-400" : "bg-white ring-blue-600"
                      }`}
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={stop.name} className="mb-1.5 block text-sm font-medium text-slate-700">
                      {stop.label}
                    </label>
                    <input
                      id={stop.name}
                      name={stop.name}
                      type="text"
                      value={formData[stop.name]}
                      onChange={handleChange}
                      placeholder={stop.placeholder}
                      autoComplete={stop.autoComplete}
                      aria-invalid={err ? "true" : "false"}
                      aria-describedby={err ? `${stop.name}-error` : undefined}
                      className={`${inputBase} ${borderFor(err)}`}
                    />
                    <FieldError id={`${stop.name}-error`}>{err}</FieldError>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Cycle hours */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <label htmlFor="current_cycle_used" className="mb-1.5 block text-sm font-medium text-slate-700">
              Hours used in current cycle
            </label>
            <div className="relative">
              <input
                id="current_cycle_used"
                name="current_cycle_used"
                type="number"
                inputMode="decimal"
                min="0"
                max={CYCLE_LIMIT}
                step="0.5"
                value={formData.current_cycle_used}
                onChange={handleChange}
                placeholder="0"
                aria-invalid={errors.current_cycle_used ? "true" : "false"}
                aria-describedby={`cycle-help${errors.current_cycle_used ? " current_cycle_used-error" : ""}`}
                className={`${inputBase} pr-16 tabular-nums ${borderFor(errors.current_cycle_used)}`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-slate-500">
                hours
              </span>
            </div>
            <FieldError id="current_cycle_used-error">{errors.current_cycle_used}</FieldError>

            <div className="mt-3" id="cycle-help">
              <div
                className="h-2 overflow-hidden rounded-full bg-slate-100"
                role="meter"
                aria-label="Cycle hours used"
                aria-valuemin={0}
                aria-valuemax={CYCLE_LIMIT}
                aria-valuenow={validUsed ? used : 0}
              >
                <div
                  className={`h-full rounded-full ${status ? status.bar : "bg-slate-300"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {status ? (
                  <>
                    <span className={`font-medium tabular-nums ${status.text}`}>
                      {(CYCLE_LIMIT - used).toFixed(1).replace(/\.0$/, "")}h left
                    </span>{" "}
                    of {CYCLE_LIMIT}. {status.note}.
                  </>
                ) : (
                  `The limit is ${CYCLE_LIMIT} hours per cycle.`
                )}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isLoading ? (
              <>
                <Spinner />
                Planning route
              </>
            ) : (
              "Plan trip"
            )}
          </button>
        </form>
      </div>
    </main>
  );
};

export default TripPlanner;