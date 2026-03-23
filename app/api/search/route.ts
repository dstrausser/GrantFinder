import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Grant, SearchParams } from "@/lib/constants";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const params: SearchParams = await request.json();

    if (!params.state || !params.city || !params.nonprofitType || !params.grantType) {
      return NextResponse.json(
        { error: "Missing required search parameters" },
        { status: 400 }
      );
    }

    const nonprofitFilter = params.nonprofitType === "Any"
      ? "All non-profit types (Healthcare, Education, Housing Assistance, and others)"
      : `${params.nonprofitType} non-profit organizations`;

    const grantFilter = params.grantType === "Any"
      ? "All grant categories (IT, Security, Finance, Hardware, Software, Training, Infrastructure, Research, Community Development, Environmental, Capital Improvement, and others)"
      : `the ${params.grantType} category`;

    const today = new Date().toISOString().split("T")[0];

    const prompt = `You are an expert grant researcher. Search for and identify all relevant state, local, and federal grants that match the following criteria. Focus ONLY on grants with OPEN or UPCOMING application windows.

CRITICAL REQUIREMENTS:
- Today's date is ${today}. Do NOT include any grants whose application deadline has already passed. Only include grants that are currently accepting applications, have upcoming application windows, or accept applications on a rolling basis.
- ONLY include grants where the APPLICANT is a non-profit organization, agency, or institution — NOT grants for individuals. The non-profit is the entity applying for and receiving the funding. For example, a vocational services non-profit would apply for a grant to fund its programs that serve individuals — the grant goes to the organization, not to the people it serves.
- ONLY include grants that you are confident actually exist as real programs. Do NOT fabricate or invent grant programs.

Search Criteria:
- Location: ${params.city}, ${params.county ? params.county + ", " : ""}${params.state}
- Non-Profit Type: ${nonprofitFilter}
- Grant Category: ${grantFilter}

Instructions:
1. Search comprehensively across federal (grants.gov, HHS, HUD, DOE, USDA, etc.), state-level, and local/county grant programs.
2. ONLY include grants where the deadline is AFTER ${today} or the grant has rolling/continuous applications.
3. ONLY include grants where a non-profit organization is an eligible applicant. Exclude grants that are only available to individuals, families, or for-profit businesses.
4. For each grant found, provide accurate and detailed information.
5. Focus on grants specifically relevant to ${nonprofitFilter} in ${grantFilter}.
6. Include both well-known major grants and lesser-known local opportunities.

CRITICAL URL RULES — READ CAREFULLY:
- Do NOT guess, fabricate, or hallucinate any URLs. If you are not 100% certain a URL is correct and leads to the SPECIFIC grant listing page, set applicationUrl to "N/A".
- A wrong URL is WORSE than no URL. Linking a FEMA grant to an EPA page is unacceptable.
- For federal grants on grants.gov, only provide a URL if you know the exact opportunity number (e.g., FEMA-2024-0001). The format is https://www.grants.gov/search-results-detail/OPPORTUNITY_NUMBER
- NEVER link to a general agency homepage (e.g., https://www.fema.gov or https://www.grants.gov). That is NOT helpful.
- When in doubt, use "N/A" and provide good searchInstructions instead.

Return your response as a JSON array of grant objects. Each object must have exactly these fields:
- "name": Full official name of the grant program
- "agency": The administering agency or organization
- "level": One of "Federal", "State", or "Local"
- "description": A 2-3 sentence overview of what the grant funds and its purpose
- "coverage": What expenses/activities the grant covers
- "eligibility": Key eligibility requirements for non-profits
- "fundingRange": The funding amount range (e.g., "$10,000 - $500,000")
- "deadline": Application deadline (must be after ${today}) or "Rolling" if applications are accepted on a rolling basis
- "applicationUrl": The EXACT URL to the specific grant opportunity page. ONLY provide this if you are 100% certain the URL is correct and goes to THIS SPECIFIC grant. Use "N/A" if you have ANY doubt.
- "searchInstructions": Step-by-step instructions for the user to find and apply for this grant. ALWAYS include this. Example: "Go to grants.gov and search for 'CFDA 93.224'. Click on the opportunity titled 'Community Health Centers'. Then click 'Apply' to begin the application." or "Visit the Pennsylvania Department of Health website, navigate to 'Funding Opportunities', and search for 'Primary Care Practitioner Loan Repayment Program'."
- "cfdaNumber": For federal grants, provide the CFDA/Assistance Listing number (e.g., "93.224"). For non-federal grants, use "N/A".
- "status": One of "Open", "Upcoming", or "Rolling"
- "grantCategory": The primary category this grant falls under (e.g., "IT", "Security", "Finance", "Hardware", "Software", "Training & Workforce Development", "Infrastructure", "Research", "Community Development", "Environmental", "Capital Improvement", or other relevant category)

Return ONLY the JSON array, no other text. If no grants are found, return an empty array [].
Aim to find at least 5-10 relevant grants if possible.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response format from AI" },
        { status: 500 }
      );
    }

    // Extract JSON from the response (handle markdown code blocks)
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let grants: Grant[];
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
    console.error("Grant search error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
