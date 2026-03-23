import { NextRequest, NextResponse } from "next/server";
import type { Grant, SearchParams } from "@/lib/constants";
import { GRANT_TYPE_TO_FUNDING_CATEGORY, NONPROFIT_ELIGIBILITY_CODES } from "@/lib/constants";
import { searchGrants, fetchOpportunitiesBatch } from "@/lib/grantsGov";
import { mapOpportunityToGrant, isGrantOpen, isNonprofitEligible } from "@/lib/mapGrant";

export async function POST(request: NextRequest) {
  try {
    const params: SearchParams = await request.json();

    if (!params.state || !params.city || !params.nonprofitType || !params.grantType) {
      return NextResponse.json(
        { error: "Missing required search parameters" },
        { status: 400 }
      );
    }

    // Build keyword from the search parameters
    const keywordParts: string[] = [];
    if (params.nonprofitType && params.nonprofitType !== "Any") {
      keywordParts.push(params.nonprofitType);
    }
    if (params.grantType && params.grantType !== "Any") {
      keywordParts.push(params.grantType);
    }
    // Add "nonprofit" to help filter results
    keywordParts.push("nonprofit");
    const keyword = keywordParts.join(" ");

    // Map grant type to Grants.gov funding category code
    let fundingCategories: string | undefined;
    if (params.grantType && params.grantType !== "Any") {
      fundingCategories = GRANT_TYPE_TO_FUNDING_CATEGORY[params.grantType];
    }
    // Also check nonprofitType for category mapping
    if (!fundingCategories && params.nonprofitType && params.nonprofitType !== "Any") {
      fundingCategories = GRANT_TYPE_TO_FUNDING_CATEGORY[params.nonprofitType];
    }

    // Search Grants.gov — try with category filter first, fall back to keyword-only
    let searchResult = await searchGrants({
      keyword,
      oppStatuses: "posted",
      fundingCategories,
      eligibilities: NONPROFIT_ELIGIBILITY_CODES,
      rows: 25,
    });

    // If no results with category filter, retry without it
    if (searchResult.hitCount === 0 && fundingCategories) {
      searchResult = await searchGrants({
        keyword,
        oppStatuses: "posted",
        eligibilities: NONPROFIT_ELIGIBILITY_CODES,
        rows: 25,
      });
    }

    // If still no results, try a broader keyword
    if (searchResult.hitCount === 0) {
      const broaderKeyword = params.nonprofitType !== "Any"
        ? params.nonprofitType
        : params.grantType !== "Any"
        ? params.grantType
        : "nonprofit";
      searchResult = await searchGrants({
        keyword: broaderKeyword,
        oppStatuses: "posted",
        eligibilities: NONPROFIT_ELIGIBILITY_CODES,
        rows: 25,
      });
    }

    if (searchResult.oppHits.length === 0) {
      return NextResponse.json({ grants: [] });
    }

    // Fetch full details for top hits (limit to 15 to stay within rate limits)
    const topHits = searchResult.oppHits.slice(0, 15);
    const hitMap = new Map(topHits.map((h) => [String(h.id), h]));
    const opportunities = await fetchOpportunitiesBatch(
      topHits.map((h) => String(h.id))
    );

    // Map to Grant interface, filter for nonprofits and open deadlines
    const grants: Grant[] = opportunities
      .filter(isNonprofitEligible)
      .map((opp) => mapOpportunityToGrant(opp, hitMap.get(String(opp.id))))
      .filter(isGrantOpen);

    return NextResponse.json({ grants });
  } catch (error) {
    console.error("Grant search error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
