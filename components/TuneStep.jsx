"use client";
import { useState } from "react";

export default function TuneStep({ onSettingsChange }) {
  const [mode, setMode] = useState("flexi"); // flexi or strict
  const [workHoursStart, setWorkHoursStart] = useState("09:00");
  const [workHoursEnd, setWorkHoursEnd] = useState("17:00");
  const [maxHoursPerDay, setMaxHoursPerDay] = useState(8);
  const [breakMinutes, setBreakMinutes] = useState(15);
  const [preferredDays, setPreferredDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (onSettingsChange) {
      onSettingsChange({
        mode: newMode,
        workHoursStart,
        workHoursEnd,
        maxHoursPerDay,
        breakMinutes,
        preferredDays,
      });
    }
  };

  const handleSettingsUpdate = () => {
    if (onSettingsChange) {
      onSettingsChange({
        mode,
        workHoursStart,
        workHoursEnd,
        maxHoursPerDay,
        breakMinutes,
        preferredDays,
      });
    }
  };

  const toggleDay = (day) => {
    const newDays = preferredDays.includes(day)
      ? preferredDays.filter((d) => d !== day)
      : [...preferredDays, day].sort();
    setPreferredDays(newDays);
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section className="w-full max-w-2xl p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-4">Tune Your Preferences</h3>
      
      {/* Mode Toggle */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Planning Mode</label>
        <div className="flex gap-3">
          <button
            onClick={() => handleModeChange("strict")}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              mode === "strict"
                ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            Strict Mode
          </button>
          <button
            onClick={() => handleModeChange("flexi")}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              mode === "flexi"
                ? "border-purple-500 bg-purple-50 text-purple-700 font-semibold"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            Flexi Mode
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {mode === "strict"
            ? "Strictly follow work hours and burnout guards"
            : "Flexible scheduling with preferences as guidelines"}
        </p>
      </div>

      {/* Work Hours */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Work Hours</label>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={workHoursStart}
            onChange={(e) => setWorkHoursStart(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <span className="text-gray-500">to</span>
          <input
            type="time"
            value={workHoursEnd}
            onChange={(e) => setWorkHoursEnd(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Max Hours Per Day */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          Max Hours Per Day: {maxHoursPerDay}h
        </label>
        <input
          type="range"
          min="1"
          max="12"
          value={maxHoursPerDay}
          onChange={(e) => setMaxHoursPerDay(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1h</span>
          <span>12h</span>
        </div>
      </div>

      {/* Break Duration */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          Break Between Tasks: {breakMinutes} min
        </label>
        <input
          type="range"
          min="0"
          max="60"
          step="5"
          value={breakMinutes}
          onChange={(e) => setBreakMinutes(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0 min</span>
          <span>60 min</span>
        </div>
      </div>

      {/* Preferred Days */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Preferred Work Days</label>
        <div className="flex gap-2">
          {dayNames.map((day, idx) => (
            <button
              key={idx}
              onClick={() => toggleDay(idx)}
              className={`px-3 py-2 rounded-lg border transition-all ${
                preferredDays.includes(idx)
                  ? "border-green-500 bg-green-50 text-green-700 font-medium"
                  : "border-gray-300 bg-white text-gray-500"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSettingsUpdate}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Save Preferences
      </button>
    </section>
  );
}

