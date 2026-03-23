import type { Grant } from "@/lib/constants";

interface GrantCardProps {
  grant: Grant & { matchReason?: string };
}

const levelColors: Record<Grant["level"], string> = {
  Federal: "bg-blue-100 text-blue-800",
  State: "bg-green-100 text-green-800",
  Local: "bg-amber-100 text-amber-800",
};

const statusColors: Record<Grant["status"], string> = {
  Open: "bg-emerald-100 text-emerald-800",
  Upcoming: "bg-purple-100 text-purple-800",
  Rolling: "bg-cyan-100 text-cyan-800",
};

export default function GrantCard({ grant }: GrantCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-gray-900">{grant.name}</h3>
        <div className="flex gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${levelColors[grant.level]}`}
          >
            {grant.level}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[grant.status]}`}
          >
            {grant.status}
          </span>
        </div>
      </div>

      <div className="mb-1 flex items-center gap-2">
        <p className="text-sm font-medium text-indigo-600">{grant.agency}</p>
        {grant.grantCategory && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {grant.grantCategory}
          </span>
        )}
      </div>

      <p className="mb-4 text-sm leading-relaxed text-gray-600">
        {grant.description}
      </p>

      {grant.matchReason && (
        <div className="mb-4 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
          <span className="font-semibold">Why this matches:</span> {grant.matchReason}
        </div>
      )}

      <div className="space-y-2 border-t border-gray-100 pt-4">
        <div className="flex gap-2 text-sm">
          <span className="font-semibold text-gray-700 min-w-[100px]">Coverage:</span>
          <span className="text-gray-600">{grant.coverage}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="font-semibold text-gray-700 min-w-[100px]">Eligibility:</span>
          <span className="text-gray-600">{grant.eligibility}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="font-semibold text-gray-700 min-w-[100px]">Funding:</span>
          <span className="text-gray-600">{grant.fundingRange}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="font-semibold text-gray-700 min-w-[100px]">Deadline:</span>
          <span className="text-gray-600">{grant.deadline}</span>
        </div>
      </div>

      {grant.applicationUrl && grant.applicationUrl !== "N/A" && (
        <div className="mt-4">
          <a
            href={grant.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
          >
            View Application
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
