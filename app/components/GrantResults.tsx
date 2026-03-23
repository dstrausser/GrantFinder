"use client";

import { useState, useMemo } from "react";
import type { Grant } from "@/lib/constants";
import GrantCard from "./GrantCard";

interface GrantResultsProps {
  grants: Grant[];
  searchParams: { state: string; city: string; nonprofitType: string; grantType: string } | null;
}

export default function GrantResults({ grants, searchParams }: GrantResultsProps) {
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Extract unique categories from results for the filter dropdown
  const categories = useMemo(() => {
    const cats = new Set(grants.map((g) => g.grantCategory).filter(Boolean));
    return Array.from(cats).sort();
  }, [grants]);

  const filteredGrants = useMemo(() => {
    return grants.filter((g) => {
      if (levelFilter !== "All" && g.level !== levelFilter) return false;
      if (categoryFilter !== "All" && g.grantCategory !== categoryFilter) return false;
      if (statusFilter !== "All" && g.status !== statusFilter) return false;
      return true;
    });
  }, [grants, levelFilter, categoryFilter, statusFilter]);

  if (!searchParams) return null;

  const hasActiveFilters = levelFilter !== "All" || categoryFilter !== "All" || statusFilter !== "All";

  return (
    <div className="mt-10">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Grant Results</h2>
            <p className="mt-1 text-sm text-gray-500">
              Found {grants.length} grant{grants.length !== 1 ? "s" : ""} for{" "}
              <span className="font-medium text-gray-700">
                {searchParams.nonprofitType}
              </span>{" "}
              non-profits in{" "}
              <span className="font-medium text-gray-700">
                {searchParams.city}, {searchParams.state}
              </span>{" "}
              ({searchParams.grantType})
            </p>
          </div>
        </div>

        {/* Filters */}
        {grants.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Filter:
            </span>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 focus:outline-none"
            >
              <option value="All">All Levels</option>
              <option value="Federal">Federal</option>
              <option value="State">State</option>
              <option value="Local">Local</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Rolling">Rolling</option>
            </select>

            {categories.length > 1 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setLevelFilter("All");
                  setCategoryFilter("All");
                  setStatusFilter("All");
                }}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition"
              >
                Clear Filters
              </button>
            )}

            {hasActiveFilters && (
              <span className="text-xs text-gray-400">
                Showing {filteredGrants.length} of {grants.length}
              </span>
            )}
          </div>
        )}
      </div>

      {grants.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">
            No grants found matching your criteria. Try broadening your search.
          </p>
        </div>
      ) : filteredGrants.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">
            No grants match the current filters. Try adjusting the filters above.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredGrants.map((grant, index) => (
            <GrantCard key={index} grant={grant} />
          ))}
        </div>
      )}
    </div>
  );
}
