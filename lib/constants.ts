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
  opportunityNumber?: string;
  matchReason?: string;
}

// Grants.gov eligibility codes for nonprofit applicants
export const NONPROFIT_ELIGIBILITY_CODES = "12|13"; // 501(c)(3) and non-501(c)(3)

// Map app grant types to Grants.gov fundingCategories codes
export const GRANT_TYPE_TO_FUNDING_CATEGORY: Record<string, string> = {
  "Healthcare": "HL",
  "Education": "ED",
  "Housing Assistance": "HO",
  "Community Development": "CD",
  "Environmental": "ENV",
  "Research": "ST",
  "Infrastructure": "IS",
  "Training & Workforce Development": "ELT",
};

// Map Grants.gov fundingCategories codes back to app grant types
export const FUNDING_CATEGORY_TO_GRANT_TYPE: Record<string, string> = {
  "HL": "Healthcare",
  "ED": "Education",
  "HO": "Housing",
  "CD": "Community Development",
  "ENV": "Environmental",
  "ST": "Research",
  "IS": "Infrastructure",
  "ELT": "Training & Workforce Development",
  "AG": "Agriculture",
  "AR": "Arts",
  "BC": "Business and Commerce",
  "CP": "Consumer Protection",
  "DPR": "Disaster Prevention and Relief",
  "EN": "Energy",
  "FN": "Food and Nutrition",
  "HU": "Humanities",
  "ISS": "Income Security and Social Services",
  "LJL": "Law and Justice",
  "NR": "Natural Resources",
  "RA": "Regional Development",
  "RD": "Science and Technology",
  "T": "Transportation",
  "ACA": "Affordable Care Act",
};
