import "server-only";

import {
  distanceInKilometres,
  type NgoDiscoveryFilters,
  type PublicNgo,
} from "@/lib/discovery/filters";
import { createAdminClient } from "@/lib/supabase/admin";

type NgoRecord = PublicNgo & {
  mission: string | null;
  impact_areas: string[] | null;
  program_summary: string | null;
  created_at: string;
  ngo_verifications?: Array<{
    verification_status: string;
    has_80g: boolean;
  }>;
};

export type NgoDiscoveryResult = {
  ngos: PublicNgo[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: boolean;
};

function normalizedText(value: string | null | undefined) {
  return value?.toLocaleLowerCase("en-IN") ?? "";
}

function matchesSearch(ngo: NgoRecord, search: string) {
  const needle = normalizedText(search);
  return [
    ngo.name,
    ngo.display_name,
    ngo.description,
    ngo.tagline,
    ngo.mission,
    ngo.program_summary,
    ...(ngo.impact_areas ?? []),
  ].some((value) => normalizedText(value).includes(needle));
}

export async function discoverNgos(
  filters: NgoDiscoveryFilters,
): Promise<NgoDiscoveryResult> {
  const { data, error } = await createAdminClient()
    .from("ngos")
    .select(
      "id, name, display_name, description, tagline, mission, impact_areas, program_summary, category, city, state, latitude, longitude, logo_path, cover_image_path, is_verified, accepts_volunteers, accepts_csr, average_rating, total_reviews, created_at, ngo_verifications(verification_status, has_80g)",
    )
    .eq("profile_status", "published")
    .eq("is_discoverable", true);

  if (error) {
    console.error("NGO discovery query failed");
    return {
      ngos: [],
      total: 0,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: 0,
      error: true,
    };
  }

  let ngos = (data ?? []) as NgoRecord[];
  if (filters.search) {
    ngos = ngos.filter((ngo) => matchesSearch(ngo, filters.search!));
  }
  if (filters.category) {
    ngos = ngos.filter((ngo) => ngo.category === filters.category);
  }
  if (filters.state) {
    const state = normalizedText(filters.state);
    ngos = ngos.filter((ngo) => normalizedText(ngo.state) === state);
  }
  if (filters.city) {
    const city = normalizedText(filters.city);
    ngos = ngos.filter((ngo) => normalizedText(ngo.city).includes(city));
  }
  if (filters.verified !== undefined) {
    ngos = ngos.filter((ngo) => ngo.is_verified === filters.verified);
  }
  if (filters.has80g !== undefined) {
    ngos = ngos.filter((ngo) => {
      const verified80g = ngo.ngo_verifications?.some(
        (verification) =>
          verification.verification_status === "verified" &&
          verification.has_80g,
      );
      return Boolean(verified80g) === filters.has80g;
    });
  }
  if (filters.volunteering !== undefined) {
    ngos = ngos.filter(
      (ngo) => ngo.accepts_volunteers === filters.volunteering,
    );
  }
  if (filters.csr !== undefined) {
    ngos = ngos.filter((ngo) => ngo.accepts_csr === filters.csr);
  }

  if (
    filters.latitude !== undefined &&
    filters.longitude !== undefined &&
    filters.distanceKm !== undefined
  ) {
    ngos = ngos
      .filter((ngo) => ngo.latitude !== null && ngo.longitude !== null)
      .map((ngo) => ({
        ...ngo,
        distanceKm: distanceInKilometres(
          filters.latitude!,
          filters.longitude!,
          ngo.latitude!,
          ngo.longitude!,
        ),
      }))
      .filter((ngo) => ngo.distanceKm <= filters.distanceKm!);
  }

  ngos.sort((left, right) => {
    if (filters.sort === "distance") {
      return (left.distanceKm ?? Infinity) - (right.distanceKm ?? Infinity);
    }
    if (filters.sort === "rating") {
      return right.average_rating - left.average_rating;
    }
    if (filters.sort === "name") {
      return (left.display_name ?? left.name ?? "").localeCompare(
        right.display_name ?? right.name ?? "",
        "en-IN",
      );
    }
    return Date.parse(right.created_at) - Date.parse(left.created_at);
  });

  const total = ngos.length;
  const totalPages = Math.ceil(total / filters.pageSize);
  const page = totalPages === 0 ? 1 : Math.min(filters.page, totalPages);
  const offset = (page - 1) * filters.pageSize;
  const pageRecords = ngos
    .slice(offset, offset + filters.pageSize)
    .map((ngo) => {
      const { ngo_verifications: _verification, ...publicNgo } = ngo;
      return publicNgo;
    });

  return {
    ngos: pageRecords,
    total,
    page,
    pageSize: filters.pageSize,
    totalPages,
    error: false,
  };
}
