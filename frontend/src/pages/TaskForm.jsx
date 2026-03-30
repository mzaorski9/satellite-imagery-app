  // frontend/src/pages/TaskForm.jsx
  import { useState, useEffect } from "react";
  import { apiFetch } from "../apiFetch.js";
  import { useNavigate } from "react-router-dom";
  import MapAreaSelector from "../components/MapAreaSelector.jsx";

  export default function TaskForm({ onSubmit }) {
    const [formData, setFormData] = useState({
      lat_min: "",
      lat_max: "",
      lon_min: "",
      lon_max: "",
      start_date: "",
      end_date: "",
      analysis_type: "ndvi",
      comparison: false,
      compare_start_date: "",
      compare_end_date: "",
    });

    // fieldErrors: { lat_min: "msg", non_field_errors: "msg", ... }
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null); // hold API response on success
    const [showMap, setShowMap] = useState(false);
    const navigate = useNavigate();
    const [seasonWarn, setSeasonWarn] = useState(null);
    const [autoRangeDays, setAutoRangeDays] = useState(14); // date auto-completion from the 'start_date'

    // Load user settings on component mount
    useEffect(() => {
      const fetchSettings = async () => {
        try {
          const res = await apiFetch(`/api/accounts/me/settings/`);
          if (!res.ok) throw new Error("Failed to load settings");
          const data = await res.json();

          setFormData((prev) => ({
            ...prev,
            comparison: data.default_comparison,
            analysis_type: data.default_analysis,
          }));

          setAutoRangeDays(data.default_date_days);
        } catch (err) {
          // non-critical — form uses hardcoded defaults if settings fail to load
        }
      };

      fetchSettings();
    }, []);

    // Calculate end date by adding autoRangeDays, capped at today's date
    const autoSetEndDate = (startDate) => {
      const d = new Date(startDate);
      if (isNaN(d.getTime())) return null;
      d.setDate(d.getDate() + autoRangeDays);

      const today = new Date();
      if (d > today) return today;
      return d;
    };

    // Validate date fields format and year range
    const validateDates = (payload) => {
      const dateFields = ["start_date", "end_date"];
      if (payload.comparison) {
        dateFields.push("compare_start_date", "compare_end_date");
      }

      for (const field of dateFields) {
        const val = payload[field];
        if (!val) continue;
        const d = new Date(val);

        if (
          isNaN(d.getTime()) ||
          d.getFullYear() < 2000 ||
          d.getFullYear() > 2100
        ) {
          return {
            ok: false,
            field,
            message:
              "Invalid date. Please use the calendar picker or correct it manually.",
          };
        }
      }
      return { ok: true };
    };

    // Handle input changes with auto-completion for date ranges
    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;

      setFormData((prev) => {
        const temp = {
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        };

        // Auto-set end_date to 14 days after start_date if not already set
        if (name === "start_date" && !formData.end_date) {
          const end = autoSetEndDate(value);
          if (end) temp.end_date = end.toISOString().slice(0, 10);
        }

        // Auto-set compare_end_date to 14 days after compare_start_date if not already set
        if (name === "compare_start_date" && !formData.compare_end_date) {
          const end = autoSetEndDate(value);
          if (end) temp.compare_end_date = end.toISOString().slice(0, 10);
        }

        return temp;
      });

      // Clear field-level error as user types/changes that field
      setFieldErrors((prev) => {
        if (!prev[name]) return prev;
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    };

    // Handle selected area from map component
    const handleSelectedArea = (bbox) => {
      setFormData((prev) => ({
        ...prev,
        lat_min: String(bbox.lat_min),
        lat_max: String(bbox.lat_max),
        lon_min: String(bbox.lon_min),
        lon_max: String(bbox.lon_max),
      }));
    };

    // Validate coordinate values and ordering (min < max)
    const validateCoords = (payload) => {
      const latMin = Number.parseFloat(payload.lat_min);
      const latMax = Number.parseFloat(payload.lat_max);
      const lonMin = Number.parseFloat(payload.lon_min);
      const lonMax = Number.parseFloat(payload.lon_max);

      if (
        Number.isNaN(latMin) ||
        Number.isNaN(latMax) ||
        Number.isNaN(lonMin) ||
        Number.isNaN(lonMax)
      ) {
        return { ok: false, message: "Fill the fields with coordinates." };
      }

      if (latMin >= latMax) {
        return { ok: false, message: "lat_min must be < lat_max" };
      }

      if (lonMin >= lonMax) {
        return { ok: false, message: "lon_min must be < lon_max" };
      }

      return { ok: true };
    };

    // Handle form submission with validation
    const handleSubmit = async (e) => {
      e.preventDefault();
      setSeasonWarn(null);
      setFieldErrors({});
      const payload = { ...formData };

      // In no comparison mode - do not send empty comparison dates
      if (!payload.comparison) {
        delete payload.compare_start_date;
        delete payload.compare_end_date;
      } else {
        if (!payload.compare_start_date) payload.compare_start_date = null;
        if (!payload.compare_end_date) payload.compare_end_date = null;
      }

      // Warn if comparing different seasons (month difference > 1)
      if (
        payload.comparison &&
        payload.start_date &&
        payload.compare_start_date
      ) {
        const month1 = new Date(payload.start_date).getMonth();
        const month2 = new Date(payload.compare_start_date).getMonth();
        const diff = Math.abs(month1 - month2);
        // Handle wraparound (e.g. November vs January = 2, not 10)
        const monthDiff = Math.min(diff, 12 - diff);
        if (monthDiff > 1) {
          setSeasonWarn("Warning: You're comparing different seasons.");
        }
      }

      const dateCheck = validateDates(payload);
      if (!dateCheck.ok) {
        setFieldErrors({ [dateCheck.field]: dateCheck.message });
        return;
      }

      const coordCheck = validateCoords(payload);
      if (!coordCheck.ok) {
        setFieldErrors({ non_field_errors: coordCheck.message });
        return;
      }

      setLoading(true);

      try {
        const res = await apiFetch(`/api/tasks/init_task/`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          // Normalize backend errors (DRF style: { field: ["msg"] })
          if (data && typeof data === "object") {
            const errors = {};
            for (const [key, val] of Object.entries(data)) {
              if (Array.isArray(val)) errors[key] = val.join(" ");
              else if (typeof val === "object") errors[key] = JSON.stringify(val);
              else errors[key] = String(val);
            }
            setFieldErrors(errors);
          } else {
            setFieldErrors({
              non_field_errors: `Unexpected error (HTTP ${res.status})`,
            });
          }
          return;
        }

        // Success: call parent callback after brief delay and show friendly message
        setSuccessData(data);

        setTimeout(() => {
          onSubmit && onSubmit(data);
        }, 3000);
      } catch (err) {
        setFieldErrors({
          non_field_errors: `Network error: ${err.message || err}`,
        });
      } finally {
        setLoading(false);
      }
    };

    // Render success state
    if (successData) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-2xl">✅</p>
            <h2 className="text-xl font-semibold">Task submitted!</h2>
            <p className="text-gray-500 text-sm">Check the history page for status updates.</p>
          </div>
        </div>
      );
    }

    // Render form
    return (
      <div className="flex min-h-screen items-center justify-center bg-white-100">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-white p-6 shadow-md space-y-4"
        >
          <h2 className="text-2xl font-bold text-center">Task Form</h2>

          {/* Latitude min input */}
          <div>
            <label className="block text-sm font-medium mb-1">Lat min</label>
            <input
              name="lat_min"
              value={formData.lat_min}
              onChange={handleChange}
              className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
            />
            {fieldErrors.lat_min && (
              <div className="text-red-600 text-xs mt-1">{fieldErrors.lat_min}</div>
            )}
          </div>

          {/* Latitude max input */}
          <div>
            <label className="block text-sm font-medium mb-1">Lat max</label>
            <input
              name="lat_max"
              value={formData.lat_max}
              onChange={handleChange}
              className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
            />
            {fieldErrors.lat_max && (
              <div className="text-red-600 text-xs mt-1">{fieldErrors.lat_max}</div>
            )}
          </div>

          {/* Longitude min input */}
          <div>
            <label className="block text-sm font-medium mb-1">Lon min</label>
            <input
              name="lon_min"
              value={formData.lon_min}
              onChange={handleChange}
              className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
            />
            {fieldErrors.lon_min && (
              <div className="text-red-600 text-xs mt-1">{fieldErrors.lon_min}</div>
            )}
          </div>

          {/* Longitude max input */}
          <div>
            <label className="block text-sm font-medium mb-1">Lon max</label>
            <input
              name="lon_max"
              value={formData.lon_max}
              onChange={handleChange}
              className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
            />
            {fieldErrors.lon_max && (
              <div className="text-red-600 text-xs mt-1">{fieldErrors.lon_max}</div>
            )}
          </div>

          {/* Map area selector */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Don't know the coordinates? Mark the area on the map:
            </label>
            <button
              type="button"
              className="text-white bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 box-border border border-transparent font-medium leading-5 rounded-base text-sm px-4 py-2.5 text-center inline-flex items-center dark:focus:ring-[#4285F4]/55"
              onClick={() => setShowMap((s) => !s)}
            >
              Show map
            </button>
          </div>

          {/* Map modal */}
          {showMap && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden">
                <div className="relative w-full">
                  <MapAreaSelector onAreaSelected={handleSelectedArea} />
                  <button
                    type="button"
                    onClick={() => setShowMap(false)}
                    className="absolute top-3 right-3 z-[1000] bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm transition-colors"
                  >
                    ✓ Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Start date input */}
          <div>
            <label className="block text-sm font-medium mb-1">Start date</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
            />
            <p className="text-xs text-gray-500 mb-1">
              End date will be set automatically 14 days later (optimal). You can
              change it.
              <button
                type="button"
                className="ml-1 text-blue-600 hover:underline inline-flex items-center gap-1"
                onClick={() => navigate(`/dashboard/glossary`)}
              >
                Learn more →
              </button>
            </p>
            {fieldErrors.start_date && (
              <div className="text-red-600 text-xs mt-1">{fieldErrors.start_date}</div>
            )}
          </div>

          {/* End date input */}
          <div>
            <label className="block text-sm font-medium mb-1">End date</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
            />
            {fieldErrors.end_date && (
              <div className="text-red-600 text-xs mt-1">{fieldErrors.end_date}</div>
            )}
          </div>

          {/* Analysis type selector */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Analysis type
            </label>
            <select
              name="analysis_type"
              value={formData.analysis_type}
              onChange={handleChange}
              className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
            >
              <option value="ndvi">NDVI</option>
              <option value="ndmi">NDMI</option>
            </select>
            {fieldErrors.analysis_type && (
              <div className="text-red-600 text-xs mt-1">{fieldErrors.analysis_type}</div>
            )}
          </div>

          {/* Comparison checkbox */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              name="comparison"
              checked={formData.comparison}
              onChange={handleChange}
            />
            <span>Generate heatmap</span>
          </div>

          {/* Comparison fields (conditional) */}
          {formData.comparison && (
            <>
              {/* Comparison tip */}
              <div>
                <p className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                  <strong>Tip:</strong> For the most accurate heatmap, compare the
                  same months across different years (e.g., May 2024 vs. May 2025)
                  to avoid seasonal index changes.
                </p>

                {/* Compare start date input */}
                <label className="block text-sm font-medium mb-1">
                  Compare start date
                </label>
                <input
                  type="date"
                  name="compare_start_date"
                  value={formData.compare_start_date}
                  onChange={handleChange}
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                />
                <p className="text-xs text-gray-500 mb-1">
                  End date will be set automatically 14 days later (optimal). You
                  can change it.
                  <button
                    type="button"
                    className="ml-1 text-blue-600 hover:underline inline-flex items-center gap-1"
                    onClick={() => navigate(`/dashboard/glossary`)}
                  >
                    Learn more →
                  </button>
                </p>
                {fieldErrors.compare_start_date && (
                  <div className="text-red-600 text-xs mt-1">
                    {fieldErrors.compare_start_date}
                  </div>
                )}
              </div>

              {/* Compare end date input */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Compare end date
                </label>
                <input
                  type="date"
                  name="compare_end_date"
                  value={formData.compare_end_date}
                  onChange={handleChange}
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                />
                {fieldErrors.compare_end_date && (
                  <div className="text-red-600 text-xs mt-1">
                    {fieldErrors.compare_end_date}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Non-field errors */}
          {fieldErrors.non_field_errors && (
            <div
              style={{
                color: "#b91c1c",
                background: "#fee2e2",
                padding: 8,
                border: "1px solid #f5c6c6",
                borderRadius: 4,
              }}
            >
              ❌ {fieldErrors.non_field_errors}
            </div>
          )}

          {/* Season warning */}
          {seasonWarn && (
            <div
              style={{
                color: "#92400e",
                background: "#fef3c7",
                padding: 8,
                border: "1px solid #fcd34d",
                borderRadius: 4,
              }}
            >
              ⚠️ {seasonWarn}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Task"}
          </button>
        </form>
      </div>
    );
  }
