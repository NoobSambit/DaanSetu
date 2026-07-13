import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface AIFlagWithEntity {
  id: string;
  entity_type: "ngo" | "campaign";
  entity_id: string;
  reason: string;
  confidence: string;
  created_at: string;
  entity_name?: string;
  entity_category?: string;
}

export default async function AIFlagsPage() {
  const supabase = await createClient();

  // Check authentication and admin role
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in?next=/admin/ai-flags");
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    redirect("/");
  }

  // Fetch all AI flags
  const { data: flags } = await supabase
    .from("ai_flags")
    .select("*")
    .order("created_at", { ascending: false });

  const flagsList = flags || [];

  // Enrich flags with entity details
  const enrichedFlags: AIFlagWithEntity[] = await Promise.all(
    flagsList.map(async (flag) => {
      if (flag.entity_type === "ngo") {
        const { data: ngo } = await supabase
          .from("ngos")
          .select("name, category")
          .eq("id", flag.entity_id)
          .single();

        return {
          ...flag,
          entity_name: ngo?.name || "Unknown NGO",
          entity_category: ngo?.category,
        };
      } else {
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("title, category")
          .eq("id", flag.entity_id)
          .single();

        return {
          ...flag,
          entity_name: campaign?.title || "Unknown Campaign",
          entity_category: campaign?.category,
        };
      }
    }),
  );

  const confidenceColors: Record<string, string> = {
    low: "bg-yellow-100 text-yellow-800 border-yellow-300",
    medium: "bg-orange-100 text-orange-800 border-orange-300",
    high: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Quality Flags
          </h1>
          <p className="text-gray-600">
            Review content flagged by the AI system for potential quality issues
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Flags
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {flagsList.length}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  NGO Flags
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {flagsList.filter((f) => f.entity_type === "ngo").length}
                </p>
              </div>
              <div className="bg-purple-100 p-4 rounded-full">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Campaign Flags
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {flagsList.filter((f) => f.entity_type === "campaign").length}
                </p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Flags List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              Flagged Content
            </h2>
          </div>

          {enrichedFlags.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">
                No flags found
              </p>
              <p className="text-gray-600">All content looks good!</p>
            </div>
          ) : (
            <div className="divide-y">
              {enrichedFlags.map((flag) => (
                <div key={flag.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${confidenceColors[flag.confidence] || confidenceColors.medium}`}
                        >
                          {flag.confidence.toUpperCase()} CONFIDENCE
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          {flag.entity_type.toUpperCase()}
                        </span>
                      </div>

                      <Link
                        href={`/${flag.entity_type === "ngo" ? "ngos" : "campaigns"}/${flag.entity_id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition"
                      >
                        {flag.entity_name}
                      </Link>

                      <p className="text-sm text-gray-600 mt-2 mb-3">
                        <span className="font-semibold">Reason:</span>{" "}
                        {flag.reason}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          Flagged on{" "}
                          {new Date(flag.created_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                        {flag.entity_category && (
                          <>
                            <span>•</span>
                            <span>Category: {flag.entity_category}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      <Link
                        href={`/${flag.entity_type === "ngo" ? "ngos" : "campaigns"}/${flag.entity_id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Review →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
