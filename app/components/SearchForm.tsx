"use client";

import { useState, useMemo } from "react";
import { US_STATES, getCitiesForState, getCountyForCity } from "@/lib/locations";
import {
  NONPROFIT_TYPES,
  GRANT_TYPES,
  type SearchParams,
} from "@/lib/constants";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [nonprofitType, setNonprofitType] = useState<SearchParams["nonprofitType"]>("");
  const [grantType, setGrantType] = useState<SearchParams["grantType"]>("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const cities = useMemo(() => getCitiesForState(state), [state]);

  const filteredCities = useMemo(() => {
    if (!city) return cities;
    return cities.filter((c) =>
      c.toLowerCase().includes(city.toLowerCase())
    );
  }, [cities, city]);

  function handleStateChange(newState: string) {
    setState(newState);
    setCity("");
    setCounty("");
  }

  function handleCitySelect(selectedCity: string) {
    setCity(selectedCity);
    setShowCitySuggestions(false);
    const autoCounty = getCountyForCity(state, selectedCity);
    setCounty(autoCounty);
  }

  function handleCityChange(value: string) {
    setCity(value);
    setShowCitySuggestions(true);
    // Try to auto-populate county as user types
    const exactMatch = cities.find(
      (c) => c.toLowerCase() === value.toLowerCase()
    );
    if (exactMatch) {
      setCounty(getCountyForCity(state, exactMatch));
    } else {
      setCounty("");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state || !city || !nonprofitType || !grantType) return;
    onSearch({ state, city, county, nonprofitType, grantType });
  }

  const isValid = state && city && nonprofitType && grantType;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* State */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            State <span className="text-red-500">*</span>
          </label>
          <select
            value={state}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          >
            <option value="">Select a state...</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div className="relative">
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            onFocus={() => setShowCitySuggestions(true)}
            onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
            placeholder={state ? "Type a city name..." : "Select a state first"}
            disabled={!state}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
          />
          {showCitySuggestions && filteredCities.length > 0 && state && (
            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {filteredCities.map((c) => (
                <li
                  key={c}
                  onMouseDown={() => handleCitySelect(c)}
                  className="cursor-pointer px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* County (auto-populated) */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            County{" "}
            <span className="text-xs font-normal text-gray-400">
              (auto-populated)
            </span>
          </label>
          <input
            type="text"
            value={county}
            readOnly
            placeholder="Will auto-populate from city"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-600 shadow-sm"
          />
        </div>

        {/* Non-profit Type */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Non-Profit Type <span className="text-red-500">*</span>
          </label>
          <select
            value={nonprofitType}
            onChange={(e) =>
              setNonprofitType(e.target.value as SearchParams["nonprofitType"])
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          >
            <option value="">Select non-profit type...</option>
            {NONPROFIT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Grant Type */}
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Type of Grant <span className="text-red-500">*</span>
          </label>
          <select
            value={grantType}
            onChange={(e) =>
              setGrantType(e.target.value as SearchParams["grantType"])
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          >
            <option value="">Select grant type...</option>
            {GRANT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Searching for grants...
          </span>
        ) : (
          "Search for Grants"
        )}
      </button>
    </form>
  );
}
