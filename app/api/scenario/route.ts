import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Grant } from "@/lib/constants";
import { NONPROFIT_ELIGIBILITY_CODES } from "@/lib/constants";
import { searchGrants, fetchOpportunitiesBatch, type GrantsGovHit } from "@/lib/grantsGov";
import { mapOpportunityToGrant, isGrantOpen, isNonprofitEligible } from "@/lib/mapGrant";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { scenario, state, city, county } = await request.json();

    if (!scenario) {
      return NextResponse.json(
        { error: "Please describe your scenario" },
        { status: 400 }
      );
    }

    // Phase 1: Use AI to extract search keywords from the scenario
    const extractionMessage = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Extract 3-5 search keyword phrases from this nonprofit grant scenario. These keywords will be used to search grants.gov for relevant federal grants.

Scenario: "${scenario}"

Return ONLY a JSON object with this format:
{"keywords": ["keyword phrase 1", "keyword phrase 2", "keyword phrase 3"]}

Focus on the specific funding needs, industry, and activities described. Make keywords broad enough to find grants but specific enough to be relevant.`,
        },
      ],
    });

    const extractContent = extractionMessage.content[0];
    if (extractContent.type !== "text") {
      return NextResponse.json(
        { error: "Failed to analyze scenario" },
        { status: 500 }
      );
    }

    let jsonText = extractContent.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let keywords: string[];
    try {
      const parsed = JSON.parse(jsonText);
      keywords = parsed.keywords || [];
    } catch {
      // Fallback: use the first 5 words of the scenario
      keywords = [scenario.split(" ").slice(0, 5).join(" ")];
    }

    // Phase 2: Search Grants.gov with each keyword, deduplicate results
    const seenIds = new Set<string>();
    const allHits: { id: string; hit: GrantsGovHit }[] = [];

    for (const keyword of keywords.slice(0, 4)) {
      try {
        const searchResult = await searchGrants({
          keyword,
          oppStatuses: "posted",
          eligibilities: NONPROFIT_ELIGIBILITY_CODES,
          rows: 15,
        });

        for (const hit of searchResult.oppHits) {
          if (!seenIds.has(String(hit.id))) {
            seenIds.add(String(hit.id));
            allHits.push({ id: String(hit.id), hit });
          }
        }
      } catch (e) {
        console.error(`Search failed for keyword "${keyword}":`, e);
      }
    }

    if (allHits.length === 0) {
      return NextResponse.json({ grants: [] });
    }

    // Phase 3: Fetch full details for top hits
    const topHits = allHits.slice(0, 15);
    const hitMap = new Map(topHits.map((h) => [h.id, h.hit]));
    const opportunities = await fetchOpportunitiesBatch(
      topHits.map((h) => h.id)
    );

    // Map and filter
    const grants: Grant[] = opportunities
      .filter(isNonprofitEligible)
      .map((opp) => mapOpportunityToGrant(opp, hitMap.get(String(opp.id))))
      .filter(isGrantOpen);

    if (grants.length === 0) {
      return NextResponse.json({ grants: [] });
    }

    // Phase 4: Use AI to rank results and add matchReason
    const grantSummaries = grants.map((g, i) => ({
      index: i,
      name: g.name,
      description: g.description.slice(0, 200),
      coverage: g.coverage,
      fundingRange: g.fundingRange,
    }));

    const locationContext = state && city
      ? `Located in ${city}, ${county ? county + ", " : ""}${state}.`
      : "";

    const rankingMessage = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `A nonprofit described this scenario: "${scenario}"
${locationContext}

Here are real federal grants found on grants.gov. Rank them by relevance to the scenario and provide a 1-2 sentence matchReason for each explaining why it's relevant.

Grants:
${JSON.stringify(grantSummaries)}

Return ONLY a JSON array of objects with format:
[{"index": 0, "matchReason": "Why this grant matches the scenario"}]

Order by most relevant first. Include ALL grants. Be specific about how each grant relates to the described need.`,
        },
      ],
    });

    const rankContent = rankingMessage.content[0];
    if (rankContent.type === "text") {
      let rankJson = rankContent.text.trim();
      if (rankJson.startsWith("```")) {
        rankJson = rankJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      try {
        const rankings: { index: number; matchReason: string }[] = JSON.parse(rankJson);

        // Reorder grants and add matchReason
        const rankedGrants: Grant[] = [];
        for (const rank of rankings) {
          const grant = grants[rank.index];
          if (grant) {
            rankedGrants.push({ ...grant, matchReason: rank.matchReason });
          }
        }

        // Add any grants that weren't ranked
        for (let i = 0; i < grants.length; i++) {
          if (!rankings.some((r) => r.index === i)) {
            rankedGrants.push(grants[i]);
          }
        }

        return NextResponse.json({ grants: rankedGrants });
      } catch {
        // If ranking fails, return unranked grants
        return NextResponse.json({ grants });
      }
    }

    return NextResponse.json({ grants });
  } catch (error) {
    console.error("Scenario search error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
