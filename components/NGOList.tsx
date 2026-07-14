/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";

import { NGO_CAUSE_LABELS } from "@/lib/ngo/profile";
import type { PublicNgo } from "@/lib/discovery/filters";

interface NGOListProps {
  ngos: PublicNgo[];
  selectedNgoId?: string | null;
  onSelectNgo?: (ngoId: string) => void;
}

function assetUrl(path: string | null) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return path && base
    ? `${base}/storage/v1/object/public/ngos/${path.split("/").map(encodeURIComponent).join("/")}`
    : null;
}

export default function NGOList({
  ngos,
  selectedNgoId,
  onSelectNgo,
}: NGOListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {ngos.map((ngo) => {
        const logo = assetUrl(ngo.logo_path);
        return (
          <Link
            key={ngo.id}
            href={`/ngos/${ngo.id}`}
            onFocus={() => onSelectNgo?.(ngo.id)}
            onMouseEnter={() => onSelectNgo?.(ngo.id)}
            aria-current={selectedNgoId === ngo.id ? "true" : undefined}
            className={`group overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              selectedNgoId === ngo.id
                ? "border-blue-500 ring-2 ring-blue-100"
                : "border-slate-200"
            }`}
          >
            <div className="h-28 bg-gradient-to-br from-blue-50 to-indigo-100">
              {assetUrl(ngo.cover_image_path) && (
                <img
                  src={assetUrl(ngo.cover_image_path)!}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="p-5">
              <div className="-mt-12 mb-3 flex items-end justify-between gap-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-white text-xl font-bold text-blue-700 shadow-sm">
                  {logo ? (
                    <img
                      src={logo}
                      alt={`${ngo.name} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (ngo.name ?? "N").slice(0, 1)
                  )}
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                  {ngo.category
                    ? (NGO_CAUSE_LABELS[ngo.category] ?? ngo.category)
                    : "Multiple causes"}
                </span>
              </div>
              <h2 className="flex items-center gap-1.5 text-lg font-bold text-slate-950 group-hover:text-blue-700">
                {ngo.display_name ?? ngo.name}
                {ngo.is_verified && (
                  <BadgeCheck
                    className="h-5 w-5 text-green-600"
                    aria-label="Verified NGO"
                  />
                )}
              </h2>
              <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-600">
                {ngo.tagline ?? ngo.description}
              </p>
              <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {[ngo.city, ngo.state].filter(Boolean).join(", ") ||
                  "Service location not published"}
              </p>
              {ngo.distanceKm !== undefined && (
                <p className="mt-2 text-xs font-semibold text-blue-700">
                  {ngo.distanceKm.toFixed(1)} km away
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
