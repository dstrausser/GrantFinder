import type { Grant } from "./constants";
import type { GrantsGovOpportunity, GrantsGovHit } from "./grantsGov";
import { FUNDING_CATEGORY_TO_GRANT_TYPE } from "./constants";

/**
 * Strip HTML tags and truncate to roughly 2-3 sentences.
 */
function cleanDescription(html?: string): string {
  if (!html) return "No description available.";
  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  // Take first ~3 sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 3) {
    return sentences.slice(0, 3).join("").trim();
  }
  // If too long without sentence breaks, truncate
  if (text.length > 500) return text.slice(0, 497) + "...";
  return text;
}

/**
 * Format a Grants.gov date string like "Dec 01, 2026 12:00:00 AM EST" to "2026-12-01"
 */
function formatDeadline(dateStr?: string): string {
  if (!dateStr) return "Rolling";
  try {
    // Try parsing the verbose format first
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  } catch {
    // fall through
  }
  return dateStr;
}

/**
 * Format funding range from floor/ceiling values.
 */
function formatFundingRange(opp: GrantsGovOpportunity): string {
  const syn = opp.synopsis;
  if (!syn) return "See opportunity details";

  const floor = syn.awardFloor ? Number(syn.awardFloor) : 0;
  const ceiling = syn.awardCeiling ? Number(syn.awardCeiling) : 0;
  const total = syn.estimatedFunding ? Number(syn.estimatedFunding) : 0;

  const fmt = (n: number) =>
    "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  if (floor > 0 && ceiling > 0) {
    return `${fmt(floor)} - ${fmt(ceiling)}`;
  }
  if (ceiling > 0) {
    return `Up to ${fmt(ceiling)}`;
  }
  if (total > 0) {
    return `Total program funding: ${fmt(total)}`;
  }
  return "See opportunity details";
}

/**
 * Map Grants.gov funding activity categories to the closest app grant type.
 */
function mapGrantCategory(opp: GrantsGovOpportunity): string {
  const cats = opp.synopsis?.fundingActivityCategories;
  if (!cats || cats.length === 0) return "Other";

  // Try to map the first category
  const firstCat = cats[0];
  return FUNDING_CATEGORY_TO_GRANT_TYPE[firstCat.id] || firstCat.description || "Other";
}

/**
 * Map a full Grants.gov opportunity to our Grant interface.
 */
export function mapOpportunityToGrant(
  opp: GrantsGovOpportunity,
  searchHit?: GrantsGovHit
): Grant {
  const syn = opp.synopsis;
  const oppNumber = opp.opportunityNumber;

  // Build the best application URL
  const applicationUrl = syn?.fundingDescLinkUrl ||
    `https://www.grants.gov/search-results-detail/${oppNumber}`;

  // Get CFDA/ALN number from search hit (more reliable) or synopsis
  const cfdaNumber = searchHit?.cfdaList?.[0] || "N/A";

  // Get agency name
  const agency = opp.topAgencyDetails?.agencyName ||
    opp.agencyDetails?.agencyName ||
    syn?.agencyDetails?.agencyName ||
    "Federal Agency";

  // Determine status
  let status: Grant["status"] = "Open";
  if (searchHit?.oppStatus === "forecasted") {
    status = "Upcoming";
  }

  // Build eligibility string
  const eligibility = syn?.applicantTypes
    ?.map((t) => t.description)
    .join("; ") || "See opportunity details";

  // Build coverage from funding categories
  const coverage = syn?.fundingActivityCategories
    ?.map((c) => c.description)
    .join(", ") || "See opportunity details";

  return {
    name: opp.opportunityTitle,
    agency,
    level: "Federal",
    description: cleanDescription(syn?.synopsisDesc),
    coverage,
    eligibility,
    fundingRange: formatFundingRange(opp),
    deadline: formatDeadline(syn?.responseDate),
    applicationUrl,
    searchInstructions: `Visit grants.gov and search for opportunity number "${oppNumber}". Click on "${opp.opportunityTitle}" to view the full details and apply.`,
    cfdaNumber,
    status,
    grantCategory: mapGrantCategory(opp),
    opportunityNumber: oppNumber,
  };
}

/**
 * Check if a grant's deadline is in the future.
 */
export function isGrantOpen(grant: Grant): boolean {
  if (grant.deadline === "Rolling") return true;
  try {
    const deadline = new Date(grant.deadline);
    return deadline > new Date();
  } catch {
    return true; // If we can't parse, include it
  }
}

/**
 * Check if a grant accepts nonprofit applicants.
 */
export function isNonprofitEligible(opp: GrantsGovOpportunity): boolean {
  const types = opp.synopsis?.applicantTypes;
  if (!types || types.length === 0) return true; // If no eligibility data, include it

  const nonprofitIds = ["12", "13", "99", "25"]; // 501c3, non-501c3, unrestricted, others
  return types.some((t) => nonprofitIds.includes(t.id));
}
