import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Grant } from "@/lib/constants";

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

    const today = new Date().toISOString().split("T")[0];

    const locationContext = state && city
      ? `The organization is located in ${city}, ${county ? county + ", " : ""}${state}.`
      : "No specific location was provided, so search broadly across federal, state, and local grants.";

    const prompt = `You are an expert grant researcher. A non-profit organization has described their situation and needs. Analyze their scenario and find the most relevant grants that could help fund their project or need.

CRITICAL REQUIREMENTS:
- Today's date is ${today}. Do NOT include any grants whose application deadline has already passed. Only include grants that are currently accepting applications, have upcoming application windows, or accept applications on a rolling basis.
- ONLY include grants where the APPLICANT is a non-profit organization, agency, or institution — NOT grants for individuals. The non-profit is the entity applying for and receiving the funding. For example, if a vocational services non-profit says "I need to replace our phone system", the grant should go to the non-profit organization to fund that purchase — not to an individual person. The non-profit operates programs and services, and needs organizational funding to do so.

Scenario described by the organization:
"${scenario}"

${locationContext}

Instructions:
1. Analyze the scenario to understand what type of organizational funding the non-profit needs.
2. Search comprehensively across federal (grants.gov, HHS, HUD, DOE, USDA, FCC, etc.), state-level, and local/county grant programs.
3. Match grants that are most relevant to their specific described need, where the non-profit is the eligible applicant.
4. ONLY include grants where the deadline is AFTER ${today} or the grant has rolling/continuous applications.
5. ONLY include grants where a non-profit organization is an eligible applicant. Exclude grants that are only available to individuals, families, or for-profit businesses.
6. Include both well-known major grants and lesser-known local opportunities.
7. Prioritize grants that most closely match the described scenario.

Return your response as a JSON array of grant objects. Each object must have exactly these fields:
- "name": Full official name of the grant program
- "agency": The administering agency or organization
- "level": One of "Federal", "State", or "Local"
- "description": A 2-3 sentence overview of what the grant funds and its purpose
- "coverage": What expenses/activities the grant covers
- "eligibility": Key eligibility requirements for non-profits
- "fundingRange": The funding amount range (e.g., "$10,000 - $500,000")
- "deadline": Application deadline (must be after ${today}) or "Rolling" if applications are accepted on a rolling basis
- "applicationUrl": The DIRECT URL to the specific grant opportunity listing or application page — NOT a general agency homepage. For federal grants, provide the specific grants.gov opportunity link (e.g., https://www.grants.gov/search-results-detail/XXXXX). For state/local grants, provide the direct link to that specific grant's page or application portal. If the exact URL is not known, provide "N/A" rather than linking to a general website.
- "status": One of "Open", "Upcoming", or "Rolling"
- "grantCategory": The primary category this grant falls under (e.g., "IT", "Security", "Finance", "Hardware", "Software", "Training & Workforce Development", "Infrastructure", "Research", "Community Development", "Environmental", "Capital Improvement", "Telecommunications", or other relevant category)
- "matchReason": A 1-2 sentence explanation of why this grant is relevant to the described scenario

Return ONLY the JSON array, no other text. If no grants are found, return an empty array [].
Aim to find at least 5-10 relevant grants if possible.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response format from AI" },
        { status: 500 }
      );
    }

    let jsonText = content.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let grants: (Grant & { matchReason?: string })[];
    try {
      grants = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse AI response:", content.text);
      return NextResponse.json(
        { error: "Failed to parse grant results. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ grants });
  } catch (error) {
    console.error("Scenario search error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
