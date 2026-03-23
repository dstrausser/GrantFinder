"use client";

import { useState } from "react";
import SearchForm from "./components/SearchForm";
import GrantResults from "./components/GrantResults";
import type { Grant, SearchParams } from "@/lib/constants";

export default function Home() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);

  async function handleSearch(params: SearchParams) {
    setIsLoading(true);
    setError(null);
    setGrants([]);
    setSearchParams(params);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search for grants");
      }

      setGrants(data.grants);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
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
          Enter your details below and let AI find matching state, local, and
          federal grants with open or upcoming application windows.
        </p>
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
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
