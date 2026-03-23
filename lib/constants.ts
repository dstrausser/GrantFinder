export const NONPROFIT_TYPES = [
  "Healthcare",
  "Education",
  "Housing Assistance",
] as const;

export const GRANT_TYPES = [
  "IT",
  "Security",
  "Finance",
  "Hardware",
  "Software",
  "Training & Workforce Development",
  "Infrastructure",
  "Research",
  "Community Development",
  "Environmental",
  "Capital Improvement",
] as const;

export type NonprofitType = (typeof NONPROFIT_TYPES)[number];
export type GrantType = (typeof GRANT_TYPES)[number];

export interface SearchParams {
  state: string;
  city: string;
  county: string;
  nonprofitType: NonprofitType | "Any" | "";
  grantType: GrantType | "Any" | "";
}

export interface Grant {
  name: string;
  agency: string;
  level: "Federal" | "State" | "Local";
  description: string;
  coverage: string;
  eligibility: string;
  fundingRange: string;
  deadline: string;
  applicationUrl: string;
  searchInstructions: string;
  cfdaNumber: string;
  status: "Open" | "Upcoming" | "Rolling";
  grantCategory: string;
}
