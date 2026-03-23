"use client";

import { useState } from "react";
import SearchForm from "./components/SearchForm";
import ScenarioSearch from "./components/ScenarioSearch";
import GrantResults from "./components/GrantResults";
import type { Grant, SearchParams } from "@/lib/constants";

type Tab = "form" | "scenario";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("form");
  const [grants, setGrants] = useState<Grant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<{
    state: string;
    city: string;
    nonprofitType: string;
    grantType: string;
  } | null>(null);

  async function handleFormSearch(params: SearchParams) {
    setIsLoading(true);
    setError(null);
    setGrants([]);
    setSearchParams(null);

    const newSearchParams = {
      state: params.state,
      city: params.city,
      nonprofitType: params.nonprofitType,
      grantType: params.grantType,
    };

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to search for grants");
      setGrants(data.grants);
      setSearchParams(newSearchParams);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleScenarioSearch(params: {
    scenario: string;
    state: string;
    city: string;
    county: string;
  }) {
    setIsLoading(true);
    setError(null);
    setGrants([]);
    setSearchParams(null);

    const newSearchParams = {
      state: params.state || "All States",
      city: params.city || "Any City",
      nonprofitType: "Scenario Match",
      grantType: "AI-Matched",
    };

    try {
      const response = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to search for grants");
      setGrants(data.grants);
      setSearchParams(newSearchParams);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Find Grants for Your Non-Profit
        </h2>
        <p className="mt-3 text-lg text-gray-500">
          Search by criteria or describe your need and let AI find matching
          grants with open or upcoming application windows.
        </p>
      </div>

      <div className="mx-auto max-w-3xl">
        {/* Tabs */}
        <div className="mb-0 flex rounded-t-2xl border border-b-0 border-gray-200 bg-gray-50 overflow-hidden">
          <button
            onClick={() => setActiveTab("form")}
            className={`flex-1 px-6 py-3 text-sm font-semibold transition ${
              activeTab === "form"
                ? "bg-white text-indigo-700 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Search by Criteria
          </button>
          <button
            onClick={() => setActiveTab("scenario")}
            className={`flex-1 px-6 py-3 text-sm font-semibold transition ${
              activeTab === "scenario"
                ? "bg-white text-indigo-700 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Describe Your Need
          </button>
        </div>

        {/* Form Content */}
        <div className="rounded-b-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {activeTab === "form" ? (
            <SearchForm onSearch={handleFormSearch} isLoading={isLoading} />
          ) : (
            <ScenarioSearch onSearch={handleScenarioSearch} isLoading={isLoading} />
          )}
        </div>
      </div>

      {error && (
        <div className="mx-auto mt-6 max-w-3xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      <GrantResults grants={grants} searchParams={searchParams} />
    </div>
  );
}
