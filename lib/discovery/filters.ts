import { z } from "zod";

const ngoCategories = [
  "education",
  "food",
  "health",
  "women",
  "animals",
  "children",
  "environment",
  "livelihoods",
  "disability",
  "disaster-relief",
  "elderly",
  "human-rights",
  "rural-development",
  "arts-culture",
  "other",
] as const;

const campaignCategories = [
  "education",
  "food",
  "health",
  "women",
  "animals",
  "disaster",
] as const;

type SearchParams = Record<string, string | string[] | undefined>;

export type PublicNgo = {
  id: string;
  name: string | null;
  display_name: string | null;
  description: string | null;
  tagline: string | null;
  category: (typeof ngoCategories)[number] | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_path: string | null;
  cover_image_path: string | null;
  is_verified: boolean;
  accepts_volunteers: boolean;
  accepts_csr: boolean;
  average_rating: number;
  total_reviews: number;
  distanceKm?: number;
};

function scalar(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function cleanText(value: string | string[] | undefined, maxLength = 100) {
  const cleaned = scalar(value)?.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

function booleanParam(value: string | string[] | undefined) {
  const normalized = scalar(value);
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
}

function boundedInteger(
  value: string | string[] | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed = Number.parseInt(scalar(value) ?? "", 10);
  return Number.isFinite(parsed)
    ? Math.min(maximum, Math.max(minimum, parsed))
    : fallback;
}

function boundedNumber(
  value: string | string[] | undefined,
  minimum: number,
  maximum: number,
) {
  const parsed = Number(scalar(value));
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

const ngoCategorySchema = z.enum(ngoCategories);
const campaignCategorySchema = z.enum(campaignCategories);
const ngoSortSchema = z.enum(["newest", "rating", "name", "distance"]);
const campaignSortSchema = z.enum([
  "newest",
  "ending-soon",
  "most-funded",
  "progress",
]);

export type NgoDiscoveryFilters = ReturnType<typeof parseNgoDiscoveryParams>;
export type CampaignDiscoveryFilters = ReturnType<
  typeof parseCampaignDiscoveryParams
>;

export function parseNgoDiscoveryParams(params: SearchParams) {
  const latitude = boundedNumber(params.latitude, -90, 90);
  const longitude = boundedNumber(params.longitude, -180, 180);
  const requestedDistance = boundedNumber(params.distanceKm, 1, 500);
  const hasCompleteDistance =
    latitude !== undefined &&
    longitude !== undefined &&
    requestedDistance !== undefined;
  const requestedSort = ngoSortSchema.safeParse(scalar(params.sort));
  const sort =
    requestedSort.success &&
    (requestedSort.data !== "distance" || hasCompleteDistance)
      ? requestedSort.data
      : "newest";

  return {
    search: cleanText(params.search),
    category: ngoCategorySchema.safeParse(scalar(params.category)).data,
    state: cleanText(params.state, 80),
    city: cleanText(params.city, 80),
    verified: booleanParam(params.verified),
    has80g: booleanParam(params.has80g),
    volunteering: booleanParam(params.volunteering),
    csr: booleanParam(params.csr),
    latitude: hasCompleteDistance ? latitude : undefined,
    longitude: hasCompleteDistance ? longitude : undefined,
    distanceKm: hasCompleteDistance ? requestedDistance : undefined,
    page: boundedInteger(params.page, 1, 1, 100),
    pageSize: boundedInteger(params.pageSize, 24, 6, 48),
    sort,
  };
}

export function parseCampaignDiscoveryParams(params: SearchParams) {
  const sort = campaignSortSchema.safeParse(scalar(params.sort));

  return {
    search: cleanText(params.search),
    category: campaignCategorySchema.safeParse(scalar(params.category)).data,
    sort: sort.success ? sort.data : "newest",
    page: boundedInteger(params.page, 1, 1, 100),
    pageSize: boundedInteger(params.pageSize, 24, 6, 48),
  };
}

export function distanceInKilometres(
  originLatitude: number,
  originLongitude: number,
  targetLatitude: number,
  targetLongitude: number,
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(targetLatitude - originLatitude);
  const longitudeDelta = toRadians(targetLongitude - originLongitude);
  const origin = toRadians(originLatitude);
  const target = toRadians(targetLatitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(origin) * Math.cos(target) * Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
