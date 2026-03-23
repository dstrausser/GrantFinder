"use client";

import { useState } from "react";
import { US_STATES, getCitiesForState, getCountyForCity } from "@/lib/locations";

interface ScenarioSearchProps {
  onSearch: (params: {
    scenario: string;
    state: string;
    city: string;
    county: string;
  }) => void;
  isLoading: boolean;
}

export default function ScenarioSearch({ onSearch, isLoading }: ScenarioSearchProps) {
  const [scenario, setScenario] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");

  function handleStateChange(newState: string) {
    setState(newState);
    setCity("");
    setCounty("");
  }

  function handleCityChange(value: string) {
    setCity(value);
    const cities = getCitiesForState(state);
    const match = cities.find((c) => c.toLowerCase() === value.toLowerCase());
    setCounty(match ? getCountyForCity(state, match) : "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scenario.trim()) return;
    onSearch({ scenario: scenario.trim(), state, city, county });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Describe Your Need <span className="text-red-500">*</span>
        </label>
        <textarea
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          rows={4}
          placeholder='Example: "I need to replace our phone system at our Health Center" or "We want to upgrade cybersecurity at our education non-profit"'
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-400">
          Describe what you need funding for and AI will match you with relevant grants.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            State{" "}
            <span className="text-xs font-normal text-gray-400">(optional, for local grants)</span>
          </label>
          <select
            value={state}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          >
            <option value="">Select a state...</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            City{" "}
            <span className="text-xs font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            placeholder={state ? "Type a city name..." : "Select a state first"}
            disabled={!state}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!scenario.trim() || isLoading}
        className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Finding matching grants...
          </span>
        ) : (
          "Find Matching Grants"
        )}
      </button>
    </form>
  );
}
