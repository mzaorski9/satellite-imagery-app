import { useEffect, useState } from "react";
import { apiFetch } from "../apiFetch";
import { useTimezoneSelect, allTimezones } from "react-timezone-select";

export default function SettingsPage({ setTz }) {
  const [settings, setSettings] = useState(null);
  const [loadError, setLoadError] = useState(null); 
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const { options, parseTimezone } = useTimezoneSelect({
    labelStyle: "original",
    timezones: allTimezones,
  });

  // Fetch user settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiFetch(`/api/accounts/me/settings/`);
        if (!res.ok) throw new Error("Failed to load settings");
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        setLoadError(err.message);
      }
    };
    fetchSettings();
  }, []);

  // Auto-dismiss toast notifications after 3 seconds
  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => {
      setNotice(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [notice]);

  // Generic handler for input field changes (checkbox, number, text)
  const handleChange = (field) => (e) => {
    const { type, value, checked, max } = e.target;
    let newValue = null;

    if (type === "checkbox") {
      newValue = checked;
    } else if (type === "number") {
      newValue = value === "" ? "" : parseInt(value, 10);
      const parsedMax = parseInt(max, 10);
      newValue = newValue <= parsedMax ? newValue : parsedMax;
    } else {
      newValue = value;
    }

    setSettings((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  };

  // Special handler for timezone select dropdown
  const handleTimezoneChange = (tzObj) => {
    setSettings((prev) => ({
      ...prev,
      timezone: tzObj.value,
    }));
  };

  // Save settings to backend and update timezone if changed
  const saveSettings = async () => {
    setSaving(true);

    try {
      const res = await apiFetch(`/api/accounts/me/settings/`, {
        method: "PATCH",
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      const data = await res.json();
      const newTz = data.timezone;

      // Update timezone in local storage and context if changed
      if (newTz) {
        localStorage.setItem("userTimezone", newTz);
        setTz(newTz);
      }

      setNotice({ msg: "Settings updated successfully!", type: "success" });
    } catch (err) {
      setNotice({ msg: "Error saving settings.", type: "failed" });
    } finally {
      setSaving(false);
    }
  };

  // Full page error
  if (loadError) {
    return (
      <div className="flex min-h-screen justify-center items-center text-red-600">
        {loadError}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex min-h-screen justify-center items-center text-gray-500">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-10 relative">
      {/* Toast notification */}
      {notice && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 transition-all duration-300">
          <div
            className={`px-6 py-3 rounded-full shadow-2xl border flex items-center gap-3
            ${
              notice.type === "success"
                ? "bg-green-600 border-green-500 text-white"
                : "bg-red-600 border-red-500 text-white"
            }`}
          >
            <span className="text-sm font-bold">
              {notice.type === "success" ? "✓" : "✕"} {notice.msg}
            </span>
            <button
              onClick={() => setNotice(null)}
              className="ml-2 hover:opacity-70"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm bg-white p-6 shadow-md space-y-5">
        <h2 className="text-2xl font-bold text-center mb-2">Settings</h2>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded border border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-sm font-semibold text-gray-700">
              Auto-enable Heatmap
            </span>
            <input
              type="checkbox"
              checked={settings.default_comparison}
              onChange={handleChange("default_comparison")}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Default analysis type
          </label>
          <select
            value={settings.default_analysis}
            onChange={handleChange("default_analysis")}
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          >
            <option value="ndvi">NDVI</option>
            <option value="ndmi">NDMI</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            User timezone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => handleTimezoneChange(parseTimezone(e.target.value))}
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Default date range (days)
          </label>
          <input
            type="number"
            min="5"
            max="45"
            value={settings.default_date_days}
            onChange={handleChange("default_date_days")}
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
          <p className="text-xs text-gray-400 mt-1 italic">
            Available range: 5-45 days. Recommended: 14 days.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full rounded-lg bg-green-600 py-2.5 text-white font-bold hover:bg-green-700 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
