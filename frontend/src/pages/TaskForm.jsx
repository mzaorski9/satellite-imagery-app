// frontend/src/pages/TaskForm.jsx
import { useState } from "react";
import { API_BASE } from "../config.js";
import  MapAreaSelector from "../components/MapAreaSelector.jsx"

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
  const [successData, setSuccessData] = useState(null); // holds API response on success
  const [showMap, setShowMap] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));

    // clear field-level error as user types/changes that field
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };
  const handleSelectedArea = (bbox) => {
    // save bbox values to the form (in string form)
    setFormData((prev) => ({
      ...prev,
      lat_min: String(bbox.lat_min),
      lat_max: String(bbox.lat_max),
      lon_min: String(bbox.lon_min),
      lon_max: String(bbox.lon_max)
    }))
  };

  const validateCoords = (payload) => {
    // check if coordinates are numbers and "min" values are < than "max"
    const latMin = Number.parseFloat(payload.lat_min);
    const latMax = Number.parseFloat(payload.lat_max);
    const lonMin = Number.parseFloat(payload.lon_min);
    const lonMax = Number.parseFloat(payload.lon_max);

    if ((Number.isNaN(latMin)) || (Number.isNaN(latMax)) || (Number.isNaN(lonMin)) || (Number.isNaN(lonMax))) {
      return { ok: false, message: "Coordinates must be numbers." };
    };
    if (latMin >= latMax) return { ok: false, message: "lat_min must be < lat_max" };
    if (lonMin >= lonMax) return { ok: false, message: "lon_min must be < lon_max" };
    return { ok: true };  
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    const payload = { ...formData }
    if (!payload.comparison) {
      delete payload.compare_start_date;
      delete payload.compare_end_date;
    } else {
      if (!payload.compare_start_date) payload.compare_start_date = null;
      if (!payload.compare_end_date) payload.compare_end_date = null;
    }
    
    // client-side date input validation (if 'start' < 'end')
    const coordCheck = validateCoords(payload);
    if (!coordCheck.ok) {
      setFieldErrors({ non_field_errors: coordCheck.message });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/tasks/init_task/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          setFieldErrors({ non_field_errors: `Unexpected error (HTTP ${res.status})` });
        }
        return;
      }

      // success: call parent callback immediately and show friendly message
      setSuccessData(data);

      // keep success visible
      setTimeout(() => {
        onSubmit && onSubmit(data);
      }, 2000);

    } catch (err) {
      setFieldErrors({ non_field_errors: `Network error: ${err.message || err}` });
    } finally {
      setLoading(false);
    }
  };

  // small helper to produce input style (red border if field has error)
  const inputStyle = (fieldName) => ({
    padding: 8,
    borderRadius: 4,
    border: fieldErrors[fieldName] ? "1px solid #e04b4b" : "1px solid #ccc",
    outline: "none",
  });
  const errorTextStyle = { color: "#b91c1c", fontSize: 13, marginTop: 6 };

  // if OK
  if (successData) {
    // prevention agains naming (task_id or id)
    const taskId = successData.task_id ?? successData.taskId ?? successData.id ?? null;
    return (
      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <h2>✅ Task submitted successfully!</h2>
        {taskId && <p>Task ID: <strong>{taskId}</strong></p>}
        <p>The task has been queued — check the history for status updates.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}
    >
      <h2 style={{ textAlign: "center" }}>Create Task</h2>

      {fieldErrors.non_field_errors && (
        <div style={{ color: "#b91c1c", padding: 8, border: "1px solid #f5c6c6", borderRadius: 6 }}>
          {fieldErrors.non_field_errors}
        </div>
      )}

      <label>
        Lat min
        <input
          name="lat_min"
          value={formData.lat_min}
          onChange={handleChange}
          placeholder="Lat min"
          style={inputStyle("lat_min")}
        />
        {fieldErrors.lat_min && <div style={errorTextStyle}>{fieldErrors.lat_min}</div>}
      </label>

      <label>
        Lat max
        <input
          name="lat_max"
          value={formData.lat_max}
          onChange={handleChange}
          placeholder="Lat max"
          style={inputStyle("lat_max")}
        />
        {fieldErrors.lat_max && <div style={errorTextStyle}>{fieldErrors.lat_max}</div>}
      </label>

      <label>
        Lon min
        <input
          name="lon_min"
          value={formData.lon_min}
          onChange={handleChange}
          placeholder="Lon min"
          style={inputStyle("lon_min")}
        />
        {fieldErrors.lon_min && <div style={errorTextStyle}>{fieldErrors.lon_min}</div>}
      </label>

      <label>
        Lon max
        <input
          name="lon_max"
          value={formData.lon_max}
          onChange={handleChange}
          placeholder="Lon max"
          style={inputStyle("lon_max")}
        />
        {fieldErrors.lon_max && <div style={errorTextStyle}>{fieldErrors.lon_max}</div>}
      </label>

      <label>
        <div>Don't know the coordinates? Mark the area on the map:</div>
        <button type="button" onClick={() => setShowMap((s) => !s)}>
          { showMap ? "Hide map" : "Show map"}
        </button>
      </label>

      { showMap && (
        <div>
          <MapAreaSelector onAreaSelected={handleSelectedArea}/>
          <div>
            Draw a rectangle to fill coordinates. Use the delete tool to remove and draw again.
          </div>
        </div>
      )}

      <label>
        Start date
        <input
          type="date"
          name="start_date"
          value={formData.start_date}
          onChange={handleChange}
          style={inputStyle("start_date")}
        />
        {fieldErrors.start_date && <div style={errorTextStyle}>{fieldErrors.start_date}</div>}
      </label>

      <label>
        End date
        <input
          type="date"
          name="end_date"
          value={formData.end_date}
          onChange={handleChange}
          style={inputStyle("end_date")}
        />
        {fieldErrors.end_date && <div style={errorTextStyle}>{fieldErrors.end_date}</div>}
      </label>

      <label>
        Analysis type 
        <select
          name="analysis_type"
          value={formData.analysis_type}
          onChange={handleChange}
          style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        >
          <option value="ndvi">NDVI</option>
          <option value="ndwi">NDWI</option>
        </select>
        {fieldErrors.analysis_type && <div style={errorTextStyle}>{fieldErrors.analysis_type}</div>}
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          name="comparison"
          checked={formData.comparison}
          onChange={handleChange}
        />
        <span>Compare?</span>
      </label>

      {formData.comparison && (
        <>
          <label>
            Compare start date
            <input
              type="date"
              name="compare_start_date"
              value={formData.compare_start_date}
              onChange={handleChange}
              style={inputStyle("compare_start_date")}
            />
            {fieldErrors.compare_start_date && <div style={errorTextStyle}>{fieldErrors.compare_start_date}</div>}
          </label>

          <label>
            Compare end date
            <input
              type="date"
              name="compare_end_date"
              value={formData.compare_end_date}
              onChange={handleChange}
              style={inputStyle("compare_end_date")}
            />
            {fieldErrors.compare_end_date && <div style={errorTextStyle}>{fieldErrors.compare_end_date}</div>}
          </label>
        </>
      )}

      <button type="submit" disabled={loading} style={{ padding: 10 }}>
        {loading ? "Submitting..." : "Submit Task"}
      </button>
    </form>
  );
}



