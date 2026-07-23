import Link from "next/link";
import { MapPinned } from "lucide-react";

import NGOMap from "@/components/NGOMap";
import { EmptyState, PageHeader } from "@/components/ui/PagePrimitives";
import type { PublicNgo } from "@/lib/discovery/filters";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ngos")
    .select(
      "id, name, display_name, description, tagline, category, city, state, latitude, longitude, logo_path, cover_image_path, is_verified, accepts_volunteers, accepts_csr, average_rating, total_reviews",
    )
    .eq("profile_status", "published")
    .eq("is_discoverable", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("created_at", { ascending: false });
  const ngos = (data ?? []) as unknown as PublicNgo[];

  return (
    <main className="page-frame">
      <section className="page-content">
        <PageHeader
          eyebrow="Location-based discovery"
          title="Find organizations across India"
          description="Explore published NGOs with public service locations, then open a profile to learn about their work and verification details."
          actions={
            <Link href="/ngos" className="btn btn-secondary">
              Browse all NGOs
            </Link>
          }
        />

        {error ? (
          <EmptyState
            title="The organization map is temporarily unavailable"
            description="Published organization locations could not be read. Please retry shortly."
            icon={<MapPinned className="h-5 w-5" />}
          />
        ) : ngos.length === 0 ? (
          <EmptyState
            title="No published organization locations yet"
            description="Organizations appear here after they publish a discoverable profile with a service location."
            action={
              <Link href="/ngos" className="btn btn-secondary">
                Browse organizations
              </Link>
            }
            icon={<MapPinned className="h-5 w-5" />}
          />
        ) : (
          <div className="h-[min(680px,calc(100dvh-19rem))] min-h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <NGOMap ngos={ngos} />
          </div>
        )}
      </section>
    </main>
  );
}
