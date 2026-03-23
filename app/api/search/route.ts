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

    const prompt = `You are an expert grant researcher. Search for and identify all relevant state, local, and federal grants that match the following criteria. Focus on grants with OPEN or UPCOMING application windows.

Search Criteria:
- Location: ${params.city}, ${params.county ? params.county + ", " : ""}${params.state}
- Non-Profit Type: ${params.nonprofitType}
- Grant Category: ${params.grantType}

Instructions:
1. Search comprehensively across federal (grants.gov, HHS, HUD, DOE, USDA, etc.), state-level, and local/county grant programs.
2. Include grants that are currently open for applications AND grants with upcoming application windows.
3. For each grant found, provide accurate and detailed information.
4. Focus on grants specifically relevant to ${params.nonprofitType} non-profit organizations in the ${params.grantType} category.
5. Include both well-known major grants and lesser-known local opportunities.

Return your response as a JSON array of grant objects. Each object must have exactly these fields:
- "name": Full official name of the grant program
- "agency": The administering agency or organization
- "level": One of "Federal", "State", or "Local"
- "description": A 2-3 sentence overview of what the grant funds and its purpose
- "coverage": What expenses/activities the grant covers
- "eligibility": Key eligibility requirements for non-profits
- "fundingRange": The funding amount range (e.g., "$10,000 - $500,000")
- "deadline": Application deadline or "Rolling" if applications are accepted on a rolling basis
- "applicationUrl": The URL where applications can be submitted, or "N/A" if not available
- "status": One of "Open", "Upcoming", or "Rolling"

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
