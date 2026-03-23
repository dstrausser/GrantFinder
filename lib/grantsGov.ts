const GRANTS_GOV_BASE = "https://api.grants.gov/v1/api";

export interface GrantsGovSearchParams {
  keyword: string;
  oppStatuses?: string;
  fundingCategories?: string;
  eligibilities?: string;
  agencies?: string;
  rows?: number;
}

export interface GrantsGovHit {
  id: string;
  number: string;
  title: string;
  agencyCode: string;
  agency: string;
  openDate: string;
  closeDate: string;
  oppStatus: string;
  docType: string;
  cfdaList?: string[];
}

export interface GrantsGovSearchResult {
  hitCount: number;
  oppHits: GrantsGovHit[];
}

export interface GrantsGovSynopsis {
  synopsisDesc?: string;
  responseDate?: string;
  awardFloor?: string;
  awardCeiling?: string;
  awardFloorFormatted?: string;
  awardCeilingFormatted?: string;
  estimatedFunding?: string;
  estimatedFundingFormatted?: string;
  applicantTypes?: { id: string; description: string }[];
  fundingActivityCategories?: { id: string; description: string }[];
  fundingInstruments?: { id: string; description: string }[];
  agencyDetails?: { agencyName: string; agencyCode: string; topAgencyCode: string };
  topAgencyDetails?: { agencyName: string; agencyCode: string };
  fundingDescLinkUrl?: string;
  agencyContactEmail?: string;
  costSharing?: boolean;
  numberOfAwards?: string;
  applicantEligibilityDesc?: string;
}

export interface GrantsGovOpportunity {
  id: number;
  opportunityNumber: string;
  opportunityTitle: string;
  owningAgencyCode: string;
  synopsis?: GrantsGovSynopsis;
  topAgencyDetails?: { agencyName: string; agencyCode: string };
  agencyDetails?: { agencyName: string; agencyCode: string };
}

export async function searchGrants(
  params: GrantsGovSearchParams
): Promise<GrantsGovSearchResult> {
  const body: Record<string, unknown> = {
    keyword: params.keyword,
    oppStatuses: params.oppStatuses || "posted",
    rows: params.rows || 25,
  };
  if (params.fundingCategories) body.fundingCategories = params.fundingCategories;
  if (params.eligibilities) body.eligibilities = params.eligibilities;
  if (params.agencies) body.agencies = params.agencies;

  const res = await fetch(`${GRANTS_GOV_BASE}/search2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Grants.gov search failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errorcode !== 0) {
    throw new Error(`Grants.gov error: ${json.msg}`);
  }

  return {
    hitCount: json.data.hitCount,
    oppHits: json.data.oppHits || [],
  };
}

export async function fetchOpportunityDetail(
  opportunityId: string
): Promise<GrantsGovOpportunity> {
  const res = await fetch(`${GRANTS_GOV_BASE}/fetchOpportunity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ opportunityId }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Grants.gov fetchOpportunity failed: ${res.status}`);
  }

  const json = await res.json();
  if (json.errorcode !== 0) {
    throw new Error(`Grants.gov error: ${json.msg}`);
  }

  return json.data;
}

/**
 * Fetch details for multiple opportunities in batches to respect rate limits.
 * Returns only the successfully fetched ones.
 */
export async function fetchOpportunitiesBatch(
  ids: string[],
  batchSize = 5
): Promise<GrantsGovOpportunity[]> {
  const results: GrantsGovOpportunity[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map((id) => fetchOpportunityDetail(id))
    );
    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }
    // Small delay between batches to be respectful of rate limits
    if (i + batchSize < ids.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return results;
}
