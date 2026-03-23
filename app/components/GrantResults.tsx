import type { Grant } from "@/lib/constants";
import GrantCard from "./GrantCard";

interface GrantResultsProps {
  grants: Grant[];
  searchParams: { state: string; city: string; nonprofitType: string; grantType: string } | null;
}

export default function GrantResults({ grants, searchParams }: GrantResultsProps) {
  if (!searchParams) return null;

  return (
    <div className="mt-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Grant Results
          </h2>
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

      {grants.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">
            No grants found matching your criteria. Try broadening your search.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {grants.map((grant, index) => (
            <GrantCard key={index} grant={grant} />
          ))}
        </div>
      )}
    </div>
  );
}
