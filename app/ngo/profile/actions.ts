"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUserRole } from "@/lib/auth/profile";
import {
  calculateNgoProfileCompletion,
  canPublishNgoProfile,
  normalizeNgoProfileInput,
  PROFILE_SECTIONS,
  type NgoProfileSection,
} from "@/lib/ngo/profile";
import type { NgoProfileState } from "@/lib/ngo/profile-form-state";
import { createClient } from "@/lib/supabase/server";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(formData: FormData, key: string): number | null {
  const value = readString(formData, key);
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function readStringArray(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function readDelimitedStringArray(formData: FormData, key: string): string[] {
  return readString(formData, key)
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function checked(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function toProfileInput(row: Record<string, unknown>) {
  return {
    legalName: row.legal_name,
    displayName: row.display_name ?? row.name,
    tagline: row.tagline,
    description: row.description,
    mission: row.mission,
    foundingYear: row.founding_year,
    organizationType: row.organization_type,
    logoPath: row.logo_path,
    coverImagePath: row.cover_image_path,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    countryCode: row.country_code,
    latitude: row.latitude,
    longitude: row.longitude,
    primaryCause: row.category,
    impactAreas: row.impact_areas,
    beneficiaryGroups: row.beneficiary_groups,
    programSummary: row.program_summary,
    vision: row.vision,
    theoryOfChange: row.theory_of_change,
    coreValues: row.core_values,
    operatingStates: row.operating_states,
    teamSize: row.team_size,
    beneficiariesReached: row.beneficiaries_reached,
    communitiesServed: row.communities_served,
    volunteersEngaged: row.volunteers_engaged,
    websiteUrl: row.website_url,
    publicEmail: row.public_email,
    publicPhone: row.public_phone,
    socialLinks: row.social_links,
    isDiscoverable: row.is_discoverable,
    acceptsDonations: row.accepts_donations,
    acceptsVolunteers: row.accepts_volunteers,
  };
}

const sectionFields: Record<NgoProfileSection, string[]> = {
  basic: [
    "legalName",
    "displayName",
    "tagline",
    "description",
    "mission",
    "foundingYear",
    "organizationType",
  ],
  location: [
    "addressLine1",
    "city",
    "state",
    "postalCode",
    "countryCode",
    "latitude",
    "longitude",
  ],
  impact: [
    "primaryCause",
    "impactAreas",
    "beneficiaryGroups",
    "programSummary",
    "vision",
    "theoryOfChange",
    "coreValues",
    "operatingStates",
    "teamSize",
    "beneficiariesReached",
    "communitiesServed",
    "volunteersEngaged",
  ],
  verification: [],
  social: ["websiteUrl", "publicEmail", "publicPhone"],
  discoverability: [],
};

function errorsForSection(
  fieldErrors: Record<string, string>,
  section: NgoProfileSection,
) {
  const allowed = new Set(sectionFields[section]);
  return Object.fromEntries(
    Object.entries(fieldErrors).filter(([field]) => allowed.has(field)),
  );
}

async function saveVerificationSection(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ngoId: string,
  formData: FormData,
  intent: string,
): Promise<NgoProfileState | null> {
  const { data: latestSubmission } = await supabase
    .from("ngo_verifications")
    .select("id, verification_status")
    .eq("ngo_id", ngoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    latestSubmission &&
    ["pending", "verified"].includes(latestSubmission.verification_status)
  ) {
    return {
      status: "success",
      message:
        latestSubmission.verification_status === "pending"
          ? "Verification is awaiting admin review."
          : "This organization is verified.",
      verificationId: latestSubmission.id,
    };
  }

  const legalName = readString(formData, "verificationLegalName");
  const registrationNumber = readString(formData, "registrationNumber");
  const registrationType = readString(formData, "registrationType");
  const registrationDate = readString(formData, "registrationDate");
  const panNumber = readString(formData, "panNumber").toUpperCase();
  const ngoDarpanId = readString(formData, "ngoDarpanId");
  const registeredAddress = readString(formData, "registeredAddress");

  if (
    intent !== "save" &&
    (!legalName || !registrationNumber || !registrationType)
  ) {
    return {
      status: "error",
      message: "Complete the required legal details before continuing.",
      fieldErrors: {
        ...(!legalName
          ? { verificationLegalName: "Enter the registered legal name." }
          : {}),
        ...(!registrationNumber
          ? { registrationNumber: "Enter the registration number." }
          : {}),
        ...(!registrationType
          ? { registrationType: "Select the registration type." }
          : {}),
      },
    };
  }

  const { data: existing } = await supabase
    .from("ngo_verifications")
    .select("id, verification_status")
    .eq("ngo_id", ngoId)
    .in("verification_status", ["draft", "rejected"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    ngo_id: ngoId,
    legal_name: legalName || null,
    registration_number: registrationNumber || null,
    registration_type: registrationType || null,
    registration_date: registrationDate || null,
    registered_address: registeredAddress || null,
    pan_number: panNumber || null,
    ngo_darpan_id: ngoDarpanId || null,
    has_12a: checked(formData, "has12a"),
    has_80g: checked(formData, "has80g"),
    has_fcra: checked(formData, "hasFcra"),
    verification_status: "draft",
    updated_at: new Date().toISOString(),
  };

  const result = existing
    ? await supabase
        .from("ngo_verifications")
        .update(payload)
        .eq("id", existing.id)
        .select("id")
        .single()
    : await supabase
        .from("ngo_verifications")
        .insert(payload)
        .select("id")
        .single();

  if (result.error || !result.data) {
    return {
      status: "error",
      message: "Verification details could not be saved.",
    };
  }

  if (intent === "submit-verification") {
    const { count } = await supabase
      .from("ngo_verification_documents")
      .select("id", { count: "exact", head: true })
      .eq("verification_id", result.data.id);

    if (!count) {
      return {
        status: "error",
        message:
          "Upload at least one registration document before submitting for review.",
        verificationId: result.data.id,
      };
    }

    const { error } = await supabase
      .from("ngo_verifications")
      .update({
        verification_status: "pending",
        submitted_at: new Date().toISOString(),
        verification_notes: null,
      })
      .eq("id", result.data.id);

    if (error)
      return {
        status: "error",
        message: "Verification could not be submitted.",
      };
    return {
      status: "success",
      message: "Verification submitted for review.",
      verificationId: result.data.id,
    };
  }

  return {
    status: "success",
    message: "Verification draft saved.",
    verificationId: result.data.id,
  };
}

export async function saveNgoProfileAction(
  _previousState: NgoProfileState,
  formData: FormData,
): Promise<NgoProfileState> {
  const step = Math.min(
    6,
    Math.max(1, Number(readString(formData, "step")) || 1),
  );
  const section = PROFILE_SECTIONS[step - 1];
  const intent = readString(formData, "intent") || "save";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (await getUserRole(supabase, user.id)) !== "ngo") {
    return {
      status: "error",
      message: "You need an NGO account to manage this profile.",
    };
  }

  let { data: ngo } = await supabase
    .from("ngos")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ngo) {
    const { data, error } = await supabase
      .from("ngos")
      .insert({ user_id: user.id, profile_status: "draft", onboarding_step: 1 })
      .select("*")
      .single();
    if (error || !data) {
      return {
        status: "error",
        message: "Your organization draft could not be created.",
      };
    }
    ngo = data;
  }

  let savedVerificationId: string | undefined;
  if (section === "verification") {
    const verificationState = await saveVerificationSection(
      supabase,
      ngo.id,
      formData,
      intent,
    );
    savedVerificationId = verificationState?.verificationId;
    if (
      verificationState?.status === "error" ||
      intent === "submit-verification"
    ) {
      revalidatePath("/ngo/profile");
      return (
        verificationState ?? {
          status: "error",
          message: "Verification could not be saved.",
        }
      );
    }
  } else {
    let normalized;
    try {
      normalized = normalizeNgoProfileInput({
        legalName: readString(formData, "legalName"),
        displayName: readString(formData, "displayName"),
        tagline: readString(formData, "tagline"),
        description: readString(formData, "description"),
        mission: readString(formData, "mission"),
        foundingYear: readNumber(formData, "foundingYear"),
        organizationType: readString(formData, "organizationType") || null,
        logoPath: readString(formData, "logoPath"),
        coverImagePath: readString(formData, "coverImagePath"),
        addressLine1: readString(formData, "addressLine1"),
        addressLine2: readString(formData, "addressLine2"),
        city: readString(formData, "city"),
        state: readString(formData, "state"),
        postalCode: readString(formData, "postalCode"),
        countryCode: readString(formData, "countryCode") || "IN",
        latitude: readNumber(formData, "latitude"),
        longitude: readNumber(formData, "longitude"),
        primaryCause: readString(formData, "primaryCause") || null,
        impactAreas: readStringArray(formData, "impactAreas"),
        beneficiaryGroups: readStringArray(formData, "beneficiaryGroups"),
        programSummary: readString(formData, "programSummary"),
        vision: readString(formData, "vision"),
        theoryOfChange: readString(formData, "theoryOfChange"),
        coreValues: readDelimitedStringArray(formData, "coreValues"),
        operatingStates: readDelimitedStringArray(formData, "operatingStates"),
        teamSize: readNumber(formData, "teamSize"),
        beneficiariesReached: readNumber(formData, "beneficiariesReached"),
        communitiesServed: readNumber(formData, "communitiesServed"),
        volunteersEngaged: readNumber(formData, "volunteersEngaged"),
        websiteUrl: readString(formData, "websiteUrl"),
        publicEmail: readString(formData, "publicEmail"),
        publicPhone: readString(formData, "publicPhone"),
        socialLinks: {
          facebook: readString(formData, "facebookUrl"),
          instagram: readString(formData, "instagramUrl"),
          linkedin: readString(formData, "linkedinUrl"),
          youtube: readString(formData, "youtubeUrl"),
        },
        isDiscoverable: checked(formData, "isDiscoverable"),
        acceptsDonations: checked(formData, "acceptsDonations"),
        acceptsVolunteers: checked(formData, "acceptsVolunteers"),
      });
    } catch {
      return {
        status: "error",
        message: "Review the URLs and field values in this section.",
      };
    }

    const nonNegativeNumberErrors = Object.fromEntries(
      (
        [
          ["teamSize", normalized.teamSize, "Team size cannot be negative."],
          [
            "beneficiariesReached",
            normalized.beneficiariesReached,
            "Beneficiaries reached cannot be negative.",
          ],
          [
            "communitiesServed",
            normalized.communitiesServed,
            "Communities served cannot be negative.",
          ],
          [
            "volunteersEngaged",
            normalized.volunteersEngaged,
            "Volunteers engaged cannot be negative.",
          ],
        ] as const
      )
        .filter(([, value]) => value !== null && value < 0)
        .map(([field, , message]) => [field, message]),
    );
    if (Object.keys(nonNegativeNumberErrors).length > 0) {
      return {
        status: "error",
        message: "Review the impact metric values before saving.",
        fieldErrors: nonNegativeNumberErrors,
      };
    }

    const patches: Record<NgoProfileSection, Record<string, unknown>> = {
      basic: {
        legal_name: normalized.legalName,
        display_name: normalized.displayName,
        name: normalized.displayName,
        tagline: normalized.tagline,
        description: normalized.description,
        mission: normalized.mission,
        founding_year: normalized.foundingYear,
        organization_type: normalized.organizationType,
        logo_path: normalized.logoPath,
        cover_image_path: normalized.coverImagePath,
      },
      location: {
        address_line_1: normalized.addressLine1,
        address_line_2: normalized.addressLine2,
        city: normalized.city,
        state: normalized.state,
        postal_code: normalized.postalCode,
        country_code: normalized.countryCode,
        latitude: normalized.latitude,
        longitude: normalized.longitude,
      },
      impact: {
        category: normalized.primaryCause,
        impact_areas: normalized.impactAreas,
        beneficiary_groups: normalized.beneficiaryGroups,
        program_summary: normalized.programSummary,
        vision: normalized.vision,
        theory_of_change: normalized.theoryOfChange,
        core_values: normalized.coreValues,
        operating_states: normalized.operatingStates,
        team_size: normalized.teamSize,
        beneficiaries_reached: normalized.beneficiariesReached,
        communities_served: normalized.communitiesServed,
        volunteers_engaged: normalized.volunteersEngaged,
      },
      verification: {},
      social: {
        website_url: normalized.websiteUrl,
        public_email: normalized.publicEmail,
        public_phone: normalized.publicPhone,
        social_links: normalized.socialLinks,
      },
      discoverability: {
        is_discoverable: normalized.isDiscoverable,
        accepts_donations: normalized.acceptsDonations,
        accepts_volunteers: normalized.acceptsVolunteers,
      },
    };

    if (intent === "next") {
      const validation = canPublishNgoProfile(normalized);
      if (!validation.success) {
        const fieldErrors = errorsForSection(validation.fieldErrors, section);
        if (Object.keys(fieldErrors).length > 0) {
          return {
            status: "error",
            message: "Complete the required fields before continuing.",
            fieldErrors,
          };
        }
      }
    }

    const obsoleteAssetPaths: string[] = [];
    if (section === "basic") {
      const previousLogoPath =
        typeof ngo.logo_path === "string" ? ngo.logo_path : "";
      const previousCoverPath =
        typeof ngo.cover_image_path === "string" ? ngo.cover_image_path : "";
      if (
        previousLogoPath &&
        previousLogoPath !== normalized.logoPath &&
        previousLogoPath.startsWith(`${user.id}/logo/`)
      ) {
        obsoleteAssetPaths.push(previousLogoPath);
      }
      if (
        previousCoverPath &&
        previousCoverPath !== normalized.coverImagePath &&
        previousCoverPath.startsWith(`${user.id}/cover/`)
      ) {
        obsoleteAssetPaths.push(previousCoverPath);
      }
    }

    // Never regress onboarding_step — only advance it.
    // When intent is "next", advance to step+1; otherwise preserve the high-water mark.
    const currentOnboardingStep =
      typeof ngo.onboarding_step === "number" ? ngo.onboarding_step : 0;
    const effectiveStep =
      intent === "next"
        ? Math.max(currentOnboardingStep, Math.min(6, step + 1))
        : Math.max(currentOnboardingStep, step);

    const { error } = await supabase
      .from("ngos")
      .update({
        ...patches[section],
        onboarding_step: effectiveStep,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ngo.id);

    if (error)
      return { status: "error", message: "This section could not be saved." };
    if (obsoleteAssetPaths.length > 0) {
      await supabase.storage.from("ngos").remove(obsoleteAssetPaths);
    }
  }

  const { data: savedNgo } = await supabase
    .from("ngos")
    .select("*")
    .eq("id", ngo.id)
    .single();
  if (!savedNgo)
    return {
      status: "error",
      message: "The saved profile could not be reloaded.",
    };

  const profileInput = toProfileInput(savedNgo);
  const { data: latestVerification } = await supabase
    .from("ngo_verifications")
    .select("verification_status")
    .eq("ngo_id", ngo.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const currentOnboardingStepForCompletion =
    typeof savedNgo.onboarding_step === "number" ? savedNgo.onboarding_step : 0;
  const nextOnboardingStep =
    intent === "next"
      ? Math.max(currentOnboardingStepForCompletion, Math.min(6, step + 1))
      : currentOnboardingStepForCompletion;
  const completion = calculateNgoProfileCompletion(profileInput, {
    verificationStatus: latestVerification?.verification_status,
    onboardingStep: nextOnboardingStep,
  });

  // For non-section saves (verification), also advance the step without regression
  if (intent === "next" && section === "verification") {
    const verificationCurrentStep =
      typeof ngo.onboarding_step === "number" ? ngo.onboarding_step : 0;
    const verificationNextStep = Math.max(
      verificationCurrentStep,
      Math.min(6, step + 1),
    );
    await supabase
      .from("ngos")
      .update({
        onboarding_step: verificationNextStep,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ngo.id);
  }

  if (intent === "publish") {
    const validation = canPublishNgoProfile(profileInput);
    if (!validation.success) {
      return {
        status: "error",
        message: "Complete all required profile sections before publishing.",
        fieldErrors: validation.fieldErrors,
        nextStep:
          PROFILE_SECTIONS.findIndex((candidate) =>
            sectionFields[candidate].some(
              (field) => validation.fieldErrors[field],
            ),
          ) + 1,
        completionPercentage: completion.percentage,
      };
    }

    const { error } = await supabase
      .from("ngos")
      .update({
        profile_status: "published",
        published_at: savedNgo.published_at ?? new Date().toISOString(),
        onboarding_step: 6,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ngo.id);
    if (error)
      return {
        status: "error",
        message: "The profile could not be published.",
      };

    revalidatePath("/ngos");
    revalidatePath(`/ngos/${ngo.id}`);
    redirect(`/ngos/${ngo.id}`);
  }

  revalidatePath("/ngo/profile");
  return {
    status: "success",
    message: intent === "next" ? "Section saved." : "Draft saved.",
    nextStep: intent === "next" ? Math.min(6, step + 1) : step,
    completionPercentage: completion.percentage,
    verificationId: savedVerificationId,
  };
}
