import dataset from "@/data/dycom-companies.json";

export type Confidence = "documented" | "directional" | "verify";
export type SegmentKey = "communications" | "building_systems";

export interface Company {
  name: string;
  hq: string | null;
  region: string;
  joined: number | string | null;
  founded?: number;
  segment: SegmentKey;
  services: string[];
  serves: string[];
  customers: string;
  confidence: Confidence;
  notes?: string;
}

export interface ValueTier {
  tier: number;
  label: string;
  summary: string;
  items: string[];
}

export interface Meta {
  entity: string;
  ticker: string;
  as_of: string;
  primary_source: string;
  revenue_ttm_usd: number;
  backlog_total_usd: number;
  backlog_communications_usd: number;
  backlog_building_systems_usd: number;
  employees: number;
  operating_companies: number;
  fy2027_guidance_low_usd: number;
  fy2027_guidance_high_usd: number;
  hire_target: number;
  customer_concentration_fy2025_q2: Record<string, number>;
}

export interface Dataset {
  meta: Meta;
  service_lines: Record<string, string>;
  customer_segments: Record<string, string>;
  segments: Record<string, string>;
  value_chain: ValueTier[];
  companies: Company[];
  pending_additions: Array<Record<string, unknown>>;
}

export const data = dataset as unknown as Dataset;

/** Region grouping keeps the facet short and legible. */
export function regionGroup(region: string): string {
  const r = (region || "").toLowerCase();
  if (/(southeast|florida|gulf|carolina|tennessee|georgia)/.test(r)) return "Southeast + Gulf";
  if (/(northeast|new england|mid-atlantic|ny|new hampshire|vermont)/.test(r)) return "Northeast + Mid-Atlantic";
  if (/(midwest|illinois|wisconsin|minnesota)/.test(r)) return "Midwest";
  if (/(pacific|oregon|washington|western|california)/.test(r)) return "West + Pacific NW";
  if (/(southwest|texas|arizona|phoenix)/.test(r)) return "Southwest";
  if (/(mountain|colorado|utah|front range)/.test(r)) return "Mountain West";
  if (/canada/.test(r)) return "Canada";
  if (/national/.test(r)) return "National footprint";
  return "Other / regional";
}

export function fmtUSD(n: number): string {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(0) + "M";
  return "$" + n.toLocaleString();
}
