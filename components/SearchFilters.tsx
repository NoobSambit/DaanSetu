"use client";

import { LocateFixed, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import type { NgoDiscoveryFilters } from "@/lib/discovery/filters";

const categories = [
  ["", "All categories"],
  ["education", "Education"],
  ["food", "Food security"],
  ["health", "Healthcare"],
  ["women", "Women empowerment"],
  ["animals", "Animal welfare"],
  ["children", "Children"],
  ["environment", "Environment"],
  ["livelihoods", "Livelihoods"],
  ["disability", "Disability inclusion"],
  ["disaster-relief", "Disaster relief"],
  ["elderly", "Elder care"],
  ["human-rights", "Human rights"],
  ["rural-development", "Rural development"],
  ["arts-culture", "Arts and culture"],
  ["other", "Other"],
] as const;

function booleanValue(value: boolean | undefined) {
  return value === undefined ? "" : String(value);
}

export default function SearchFilters({
  filters,
}: {
  filters: NgoDiscoveryFilters;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not available in this browser.");
      return;
    }
    setLocationStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const form = formRef.current;
        if (!form) return;
        const latitude = form.elements.namedItem(
          "latitude",
        ) as HTMLInputElement;
        const longitude = form.elements.namedItem(
          "longitude",
        ) as HTMLInputElement;
        const distance = form.elements.namedItem(
          "distanceKm",
        ) as HTMLSelectElement;
        latitude.value = String(coords.latitude);
        longitude.value = String(coords.longitude);
        if (!distance.value) distance.value = "25";
        setLocationStatus("Location added. Apply filters to search nearby.");
      },
      () => setLocationStatus("Location permission was not granted."),
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 300_000 },
    );
  }

  return (
    <form
      ref={formRef}
      action="/ngos"
      method="get"
      className="card animate-fade-in p-6"
    >
      <input type="hidden" name="latitude" defaultValue={filters.latitude} />
      <input type="hidden" name="longitude" defaultValue={filters.longitude} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block text-sm font-semibold text-slate-900">
          Search
          <span className="relative mt-2 block">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              name="search"
              type="search"
              defaultValue={filters.search}
              placeholder="Name, mission, or cause"
              className="input pl-10"
            />
          </span>
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          Category
          <select
            name="category"
            defaultValue={filters.category ?? ""}
            className="input mt-2"
          >
            {categories.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          State
          <input
            name="state"
            defaultValue={filters.state}
            placeholder="e.g. Karnataka"
            className="input mt-2"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          City
          <input
            name="city"
            defaultValue={filters.city}
            placeholder="e.g. Bengaluru"
            className="input mt-2"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          Verification
          <select
            name="verified"
            defaultValue={booleanValue(filters.verified)}
            className="input mt-2"
          >
            <option value="">Any status</option>
            <option value="true">Verified only</option>
            <option value="false">Unverified only</option>
          </select>
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          80G eligibility
          <select
            name="has80g"
            defaultValue={booleanValue(filters.has80g)}
            className="input mt-2"
          >
            <option value="">Any</option>
            <option value="true">Eligible only</option>
            <option value="false">Not marked eligible</option>
          </select>
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          Volunteering
          <select
            name="volunteering"
            defaultValue={booleanValue(filters.volunteering)}
            className="input mt-2"
          >
            <option value="">Any</option>
            <option value="true">Accepting volunteers</option>
            <option value="false">Not accepting volunteers</option>
          </select>
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          CSR partnerships
          <select
            name="csr"
            defaultValue={booleanValue(filters.csr)}
            className="input mt-2"
          >
            <option value="">Any</option>
            <option value="true">CSR available</option>
            <option value="false">CSR unavailable</option>
          </select>
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          Distance
          <select
            name="distanceKm"
            defaultValue={filters.distanceKm ?? ""}
            className="input mt-2"
          >
            <option value="">Anywhere</option>
            <option value="10">Within 10 km</option>
            <option value="25">Within 25 km</option>
            <option value="50">Within 50 km</option>
            <option value="100">Within 100 km</option>
          </select>
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          Sort by
          <select
            name="sort"
            defaultValue={filters.sort}
            className="input mt-2"
          >
            <option value="newest">Newest profiles</option>
            <option value="rating">Highest rated</option>
            <option value="name">Name</option>
            <option value="distance">Nearest first</option>
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={useCurrentLocation}
            className="btn btn-secondary w-full"
          >
            <LocateFixed className="h-4 w-4" /> Use my location
          </button>
        </div>

        <div className="flex items-end gap-2">
          <Link
            href="/ngos"
            className="btn btn-secondary"
            aria-label="Reset filters"
          >
            <RotateCcw className="h-4 w-4" />
          </Link>
          <button type="submit" className="btn btn-primary flex-1">
            Apply filters
          </button>
        </div>
      </div>
      {locationStatus && (
        <p aria-live="polite" className="mt-3 text-xs text-slate-600">
          {locationStatus}
        </p>
      )}
    </form>
  );
}
