"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getVolunteerOpportunities,
  getOpportunityCities,
  applyToOpportunity,
  hasApplied,
  type OpportunityWithNGO,
} from "@/lib/services/volunteer-opportunities";
import { VOLUNTEER_SKILLS } from "@/lib/services/volunteers";

export default function VolunteerOpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<OpportunityWithNGO[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<
    OpportunityWithNGO[]
  >([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appliedOpportunities, setAppliedOpportunities] = useState<Set<string>>(
    new Set(),
  );

  // Filters
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  useEffect(() => {
    checkAuth();
    loadOpportunities();
    loadCities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [opportunities, selectedSkill, selectedCity]);

  async function checkAuth() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);

    if (user) {
      // Check which opportunities the user has already applied to
      const applied = new Set<string>();
      for (const opp of opportunities) {
        const hasAppliedToThis = await hasApplied(opp.id);
        if (hasAppliedToThis) {
          applied.add(opp.id);
        }
      }
      setAppliedOpportunities(applied);
    }
  }

  async function loadOpportunities() {
    try {
      const data = await getVolunteerOpportunities();
      setOpportunities(data);
      setFilteredOpportunities(data);
    } catch (error) {
      console.error("Failed to load opportunities:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCities() {
    const citiesList = await getOpportunityCities();
    setCities(citiesList);
  }

  function applyFilters() {
    let filtered = [...opportunities];

    if (selectedSkill) {
      filtered = filtered.filter((opp) =>
        opp.required_skills.includes(selectedSkill),
      );
    }

    if (selectedCity) {
      filtered = filtered.filter((opp) => opp.city === selectedCity);
    }

    setFilteredOpportunities(filtered);
  }

  async function handleApply(opportunityId: string) {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    try {
      await applyToOpportunity(opportunityId);
      setAppliedOpportunities((prev) => new Set(prev).add(opportunityId));
      alert("Application submitted successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to apply");
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading opportunities...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Volunteer Opportunities
          </h1>
          <p className="text-gray-600">
            Find opportunities to make a difference in your community
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Skill Filter */}
            <div>
              <label
                htmlFor="skill"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Skill
              </label>
              <select
                id="skill"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Skills</option>
                {VOLUNTEER_SKILLS.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                City
              </label>
              <select
                id="city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedSkill("");
                  setSelectedCity("");
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredOpportunities.length}{" "}
            {filteredOpportunities.length === 1
              ? "opportunity"
              : "opportunities"}
          </p>
        </div>

        {/* Opportunities Grid */}
        {filteredOpportunities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">
              No opportunities found matching your filters
            </p>
            <button
              onClick={() => {
                setSelectedSkill("");
                setSelectedCity("");
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {opportunity.title}
                  </h3>

                  <p className="text-sm text-blue-600 mb-3">
                    {opportunity.ngo.name}
                  </p>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {opportunity.description}
                  </p>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {opportunity.required_skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {opportunity.required_skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{opportunity.required_skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{opportunity.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>{formatDate(opportunity.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>👥</span>
                      <span>{opportunity.total_needed} volunteers needed</span>
                    </div>
                  </div>

                  {/* Apply Button */}
                  {appliedOpportunities.has(opportunity.id) ? (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed"
                    >
                      Already Applied
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApply(opportunity.id)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
