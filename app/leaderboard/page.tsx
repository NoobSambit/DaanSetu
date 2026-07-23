import {
  getTopDonors,
  getTopVolunteers,
  getTopNGOs,
  getTopCorporates,
} from "@/lib/services/leaderboard";
import LeaderboardSection from "./components/LeaderboardSection";
import { PageHeader } from "@/components/ui/PagePrimitives";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  // Fetch all leaderboards in parallel
  const [donors, volunteers, ngos, corporates] = await Promise.all([
    getTopDonors(10),
    getTopVolunteers(10),
    getTopNGOs(10),
    getTopCorporates(10),
  ]);

  return (
    <main className="page-frame">
      <div className="page-content">
        <PageHeader
          eyebrow="Community recognition"
          title="Community leaderboard"
          description="Celebrating top contributors and impact makers from real donation, volunteering, NGO, and CSR activity."
        />

        {/* Leaderboards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Donors */}
          <LeaderboardSection
            title="Top Donors"
            description="Most generous contributors"
            icon="💛"
            entries={donors.map((d) => ({
              rank: d.rank,
              name: d.user_name,
              subtitle: `₹${d.total_donated.toLocaleString("en-IN")} donated`,
              badge: `${d.donation_count} donations`,
            }))}
            emptyMessage="No donors yet. Be the first to donate!"
          />

          {/* Top Volunteers */}
          <LeaderboardSection
            title="Top Volunteers"
            description="Most active volunteers"
            icon="🌟"
            entries={volunteers.map((v) => ({
              rank: v.rank,
              name: v.user_name,
              subtitle: `${v.approved_hours.toLocaleString("en-IN")} approved hours`,
              badge: null,
            }))}
            emptyMessage="No volunteers yet. Be the first to volunteer!"
          />

          {/* Top NGOs */}
          <LeaderboardSection
            title="Top NGOs"
            description="Most supported organizations"
            icon="🏆"
            entries={ngos.map((n) => ({
              rank: n.rank,
              name: n.ngo_name,
              subtitle: `₹${n.total_received.toLocaleString("en-IN")} received`,
              badge: `${n.donor_count} donors`,
            }))}
            emptyMessage="No NGOs with donations yet"
          />

          {/* Top Corporates */}
          <LeaderboardSection
            title="Top Corporates"
            description="Leading CSR contributors"
            icon="🎯"
            entries={corporates.map((c) => ({
              rank: c.rank,
              name: c.company_name,
              subtitle: `₹${c.total_contributed.toLocaleString("en-IN")} contributed`,
              badge: `${c.campaign_count} campaigns`,
            }))}
            emptyMessage="No corporate CSR campaigns yet"
          />
        </div>
      </div>
    </main>
  );
}
