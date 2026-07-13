"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bookmark,
  Building2,
  CheckCircle2,
  ChevronDown,
  Eye,
  Globe2,
  Headset,
  HeartHandshake,
  Loader2,
  LocateFixed,
  Lock,
  MapPin,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { saveNgoProfileAction } from "@/app/ngo/profile/actions";
import {
  BENEFICIARY_GROUPS,
  IMPACT_AREAS,
  NGO_CAUSES,
  NGO_CAUSE_LABELS,
  ORGANIZATION_TYPES,
  PROFILE_SECTIONS,
  calculateNgoProfileCompletion,
} from "@/lib/ngo/profile";
import { INITIAL_NGO_PROFILE_STATE } from "@/lib/ngo/profile-form-state";

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-2 block text-sm font-semibold text-slate-800";

const sectionDefinitions = [
  {
    title: "Basic Information",
    description: "Organization details, mission, and description",
    icon: Building2,
  },
  {
    title: "Location",
    description: "Where is your organization based?",
    icon: MapPin,
  },
  {
    title: "Impact Focus",
    description: "Your causes, programs, and impact areas",
    icon: HeartHandshake,
  },
  {
    title: "Trust & Verification",
    description: "Legal details and verification documents",
    icon: ShieldCheck,
  },
  {
    title: "Social Presence",
    description: "Website and social media links (optional)",
    icon: Globe2,
  },
  {
    title: "Discoverability",
    description: "Visibility preferences and opportunities",
    icon: Eye,
  },
];

type ProfileData = Record<string, any>;
type VerificationData = Record<string, any> | null;
type DocumentData = {
  id: string;
  document_type: string;
  original_name: string;
  size_bytes: number;
  created_at: string;
};
type AssetUploadState = "idle" | "uploading" | "success" | "error";
type LocationDetectionState = "idle" | "detecting" | "success" | "error";

interface NgoProfileFormProps {
  initialProfile: ProfileData;
  initialStep: number;
  initialCompletion: number;
  profileStatus: "draft" | "published";
  ngoId: string | null;
  verification: VerificationData;
  initialDocuments: DocumentData[];
}

function FieldError({
  name,
  errors,
}: {
  name: string;
  errors?: Record<string, string>;
}) {
  if (!errors?.[name]) return null;
  return (
    <p className="mt-1.5 text-sm font-medium text-red-600">{errors[name]}</p>
  );
}

function PendingButtonContent({
  idle,
  pending,
  uploadPending,
}: {
  idle: React.ReactNode;
  pending: boolean;
  uploadPending: boolean;
}) {
  if (uploadPending) {
    return (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Waiting for upload...
      </>
    );
  }

  if (pending) {
    return (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Saving...
      </>
    );
  }

  return <>{idle}</>;
}

function CheckGrid({
  name,
  values,
  selected,
}: {
  name: string;
  values: readonly string[];
  selected: string[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {values.map((value) => (
        <label
          key={value}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 hover:bg-slate-50"
        >
          <input
            type="checkbox"
            name={name}
            value={value}
            defaultChecked={selected.includes(value)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          <span>
            {value
              .split("-")
              .map((part) => part[0].toUpperCase() + part.slice(1))
              .join(" ")}
          </span>
        </label>
      ))}
    </div>
  );
}

function publicAssetUrl(path: string | null) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base
    ? `${base}/storage/v1/object/public/ngos/${path.split("/").map(encodeURIComponent).join("/")}`
    : null;
}

function listToTextareaValue(values: unknown): string {
  return Array.isArray(values) ? values.filter(Boolean).join("\n") : "";
}

function deleteProfileAsset(path: string) {
  return fetch("/api/ngo/profile-assets", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
    keepalive: true,
  }).catch(() => undefined);
}

function AssetUploader({
  name,
  label,
  assetType,
  initialPath,
  onPreviewChange,
  onUploaded,
  onDiscarded,
  onBusyChange,
}: {
  name: string;
  label: string;
  assetType: "logo" | "cover";
  initialPath?: string | null;
  onPreviewChange?: (url: string | null) => void;
  onUploaded?: (asset: { path: string; url: string }) => void;
  onDiscarded?: (path: string) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const initialAssetPath = initialPath ?? "";
  const [path, setPath] = useState(initialPath ?? "");
  const [preview, setPreview] = useState(publicAssetUrl(initialPath ?? null));
  const [uploadState, setUploadState] = useState<AssetUploadState>(
    initialPath ? "success" : "idle",
  );
  const [status, setStatus] = useState(initialPath ? `${label} saved.` : "");

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function upload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadState("error");
      setStatus("Upload a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadState("error");
      setStatus("Image size must not exceed 5 MB.");
      return;
    }

    const previousPreview = preview;
    const optimisticPreview = URL.createObjectURL(file);
    setPreview(optimisticPreview);
    onPreviewChange?.(optimisticPreview);
    setUploadState("uploading");
    onBusyChange?.(true);
    setStatus(`Uploading ${label.toLowerCase()}...`);

    const body = new FormData();
    body.set("file", file);
    body.set("assetType", assetType);

    try {
      const response = await fetch("/api/ngo/profile-assets", {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) {
        setPreview(previousPreview);
        onPreviewChange?.(previousPreview);
        setUploadState("error");
        setStatus(result.error ?? "Upload failed. Please try again.");
        return;
      }

      const previousPath = path;
      setPath(result.path);
      setPreview(result.url);
      onPreviewChange?.(result.url);
      onUploaded?.({ path: result.path, url: result.url });
      if (
        previousPath &&
        previousPath !== initialAssetPath &&
        previousPath !== result.path
      ) {
        onDiscarded?.(previousPath);
        void deleteProfileAsset(previousPath);
      }
      setUploadState("success");
      setStatus(`${label} uploaded. Save draft to keep this on your profile.`);
    } catch {
      setPreview(previousPreview);
      onPreviewChange?.(previousPreview);
      setUploadState("error");
      setStatus("Upload failed. Check your connection and try again.");
    } finally {
      onBusyChange?.(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void upload(file);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="block text-sm font-semibold text-slate-800">
          {label}
        </span>
        {uploadState === "success" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
          </span>
        )}
      </div>
      <input type="hidden" name={name} value={path} />
      <label
        aria-busy={uploadState === "uploading"}
        className={`group relative flex min-h-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg border text-sm font-medium transition focus-within:ring-2 focus-within:ring-blue-100 ${
          uploadState === "error"
            ? "border-red-300 bg-red-50 text-red-700"
            : uploadState === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100"
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={`${label} preview`}
            className={`h-28 w-full object-cover ${uploadState === "uploading" ? "opacity-60" : ""}`}
          />
        ) : (
          <span className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
              <Upload className="h-4 w-4" />
            </span>
            <span>Upload {label.toLowerCase()}</span>
            <span className="text-xs font-medium text-slate-400">
              JPEG, PNG, or WebP up to 5 MB
            </span>
          </span>
        )}

        {preview && uploadState !== "uploading" && (
          <span className="absolute inset-x-3 bottom-3 flex translate-y-1 items-center justify-center rounded-lg bg-slate-950/75 px-3 py-2 text-xs font-bold text-white opacity-0 shadow-sm transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            Change {label.toLowerCase()}
          </span>
        )}

        {uploadState === "uploading" && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 text-blue-700 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm font-bold">Uploading...</span>
          </span>
        )}

        {uploadState === "error" && !preview && (
          <span className="flex flex-col items-center gap-2 text-center">
            <AlertCircle className="h-5 w-5" />
            <span>Upload failed. Choose another image.</span>
          </span>
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={uploadState === "uploading"}
          onChange={handleFileChange}
        />
      </label>
      {status && (
        <p
          className={`mt-2 flex items-start gap-1.5 text-xs font-semibold ${
            uploadState === "error"
              ? "text-red-600"
              : uploadState === "success"
                ? "text-emerald-700"
                : "text-slate-500"
          }`}
          role={uploadState === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {uploadState === "success" && (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          {uploadState === "error" && (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          {uploadState === "uploading" && (
            <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
          )}
          <span>{status}</span>
        </p>
      )}
    </div>
  );
}

function VerificationDocuments({
  verificationId,
  initialDocuments,
  disabled,
}: {
  verificationId?: string;
  initialDocuments: DocumentData[];
  disabled: boolean;
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [documentType, setDocumentType] = useState("registration");
  const [status, setStatus] = useState("");

  async function upload(file: File) {
    if (!verificationId) return;
    setStatus("Uploading document...");
    const body = new FormData();
    body.set("file", file);
    body.set("verificationId", verificationId);
    body.set("documentType", documentType);
    const response = await fetch("/api/ngo/verification-documents", {
      method: "POST",
      body,
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error ?? "Upload failed.");
      return;
    }
    setDocuments((current) => [...current, result.document]);
    setStatus("Document uploaded.");
  }

  async function remove(documentId: string) {
    const response = await fetch("/api/ngo/verification-documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });
    if (response.ok)
      setDocuments((current) =>
        current.filter((document) => document.id !== documentId),
      );
  }

  if (!verificationId) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm font-medium text-amber-900">
        Save the legal details once to enable private document uploads.
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <select
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value)}
          className={fieldClass}
          aria-label="Document type"
          disabled={disabled}
        >
          <option value="registration">Registration certificate</option>
          <option value="pan">PAN document</option>
          <option value="12a">12A certificate</option>
          <option value="80g">80G certificate</option>
          <option value="fcra">FCRA certificate</option>
          <option value="supporting">Supporting document</option>
        </select>
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 focus-within:ring-2 focus-within:ring-slate-300 disabled:opacity-50">
          <Upload className="h-4 w-4" /> Upload document
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className="sr-only"
            disabled={disabled}
            onChange={(event) =>
              event.target.files?.[0] && upload(event.target.files[0])
            }
          />
        </label>
      </div>
      <p className="text-xs font-medium text-slate-500">
        PDF, JPEG, or PNG. Maximum 10 MB. Documents are private.
      </p>

      {documents.length > 0 && (
        <div className="mt-4 space-y-2">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm"
            >
              <span className="truncate pr-3 font-medium text-slate-700">
                {document.original_name}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(document.id)}
                  className="font-semibold text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {status && (
        <p className="text-sm font-medium text-slate-600" aria-live="polite">
          {status}
        </p>
      )}
    </div>
  );
}

export default function NgoProfileForm({
  initialProfile,
  initialStep,
  initialCompletion,
  profileStatus,
  ngoId,
  verification,
  initialDocuments,
}: NgoProfileFormProps) {
  const [step, setStep] = useState(Math.min(6, Math.max(1, initialStep)));
  const [state, formAction, pending] = useActionState(saveNgoProfileAction, {
    ...INITIAL_NGO_PROFILE_STATE,
    completionPercentage: initialCompletion,
    verificationId: verification?.id,
  });
  const [liveLogoPreview, setLiveLogoPreview] = useState(
    publicAssetUrl(initialProfile.logoPath ?? null),
  );
  const [assetUploadsInFlight, setAssetUploadsInFlight] = useState(0);
  const [latitude, setLatitude] = useState(
    initialProfile.latitude == null ? "" : String(initialProfile.latitude),
  );
  const [longitude, setLongitude] = useState(
    initialProfile.longitude == null ? "" : String(initialProfile.longitude),
  );
  const [locationDetectionState, setLocationDetectionState] =
    useState<LocationDetectionState>("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const pendingAssetPathsRef = useRef<Set<string>>(new Set());
  const formSubmittingRef = useRef(false);

  useEffect(() => {
    if (state.nextStep) setStep(state.nextStep);
  }, [state.nextStep]);

  useEffect(() => {
    formSubmittingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    if (state.status === "success") {
      pendingAssetPathsRef.current.clear();
      formSubmittingRef.current = false;
    }
  }, [state.status]);

  useEffect(() => {
    function cleanupUnsavedAssets() {
      if (formSubmittingRef.current || pendingAssetPathsRef.current.size === 0)
        return;
      const paths = Array.from(pendingAssetPathsRef.current);
      pendingAssetPathsRef.current.clear();
      paths.forEach((path) => void deleteProfileAsset(path));
    }

    window.addEventListener("pagehide", cleanupUnsavedAssets);
    return () => {
      window.removeEventListener("pagehide", cleanupUnsavedAssets);
      cleanupUnsavedAssets();
    };
  }, []);

  function trackPendingAsset(path: string) {
    pendingAssetPathsRef.current.add(path);
  }

  function forgetPendingAsset(path: string) {
    pendingAssetPathsRef.current.delete(path);
  }

  async function readGeolocationPermissionState(): Promise<PermissionState | null> {
    if (!("permissions" in navigator) || !navigator.permissions.query)
      return null;

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      return permission.state;
    } catch {
      return null;
    }
  }

  async function detectCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setLocationDetectionState("error");
      setLocationMessage(
        "Your browser does not support location detection. You can enter coordinates manually.",
      );
      return;
    }

    setLocationDetectionState("detecting");
    setLocationMessage("Checking browser location permission...");
    const permissionState = await readGeolocationPermissionState();

    setLocationMessage(
      permissionState === "prompt"
        ? "Your browser should ask for location permission now."
        : "Trying to read your current location...",
    );
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = Number(
          position.coords.latitude.toFixed(6),
        ).toString();
        const nextLongitude = Number(
          position.coords.longitude.toFixed(6),
        ).toString();
        const accuracy = Math.round(position.coords.accuracy);
        setLatitude(nextLatitude);
        setLongitude(nextLongitude);
        setLocationDetectionState("success");
        setLocationMessage(
          `Location detected with about ${accuracy}m accuracy. Review before saving.`,
        );
      },
      (error) => {
        setLocationDetectionState("error");
        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage(
            "The browser did not return location access. Check the site controls/lock icon and Brave privacy settings, then try again.",
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationMessage(
            "Your location is currently unavailable. Try again or enter coordinates manually.",
          );
        } else if (error.code === error.TIMEOUT) {
          setLocationMessage(
            "Location detection timed out. Try again or enter coordinates manually.",
          );
        } else {
          setLocationMessage(
            "Could not detect location. You can enter coordinates manually.",
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    );
  }

  const verificationStatus =
    verification?.verification_status ?? "not-submitted";
  const social = initialProfile.socialLinks ?? {};

  // Track the high-water mark of the onboarding step so navigating back
  // and saving an earlier section never regresses the completion state.
  const effectiveOnboardingStep = Math.max(initialStep, state.nextStep ?? 0);

  const { sectionComplete } = calculateNgoProfileCompletion(initialProfile, {
    verificationStatus,
    onboardingStep: effectiveOnboardingStep,
  });
  const completedSections = new Set(
    PROFILE_SECTIONS.map((key, i) => {
      return sectionComplete[key] ? i + 1 : null;
    }).filter(Boolean),
  );

  const progressPercentage = state.completionPercentage ?? initialCompletion;
  const assetUploadPending = assetUploadsInFlight > 0;
  const submitDisabled = pending || assetUploadPending;
  const verificationLabel =
    verificationStatus === "verified"
      ? "Verified NGO"
      : verificationStatus === "pending"
        ? "Verification pending"
        : verificationStatus === "rejected"
          ? "Verification needs updates"
          : "Verification not submitted";
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (circumference * progressPercentage) / 100;

  return (
    <div className="mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_280px]">
      {/* LEFT COLUMN: BRANDING & PREVIEW */}
      <aside className="space-y-8 lg:sticky lg:top-8 lg:self-start">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xl font-bold text-blue-700">
            <Building2 className="h-6 w-6" />
            DaanSetu
          </div>
          <span className="rounded bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
            NGO Onboarding
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Create a trusted organization profile.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Your profile becomes your public identity on DaanSetu. Donors,
            volunteers, CSR teams, and communities will discover and evaluate
            your organization through this page.
          </p>
        </div>

        <div className="relative space-y-6 before:absolute before:inset-y-2 before:left-[19px] before:w-[2px] before:bg-slate-100">
          {[
            {
              step: "Step 1",
              title: "Organization Details",
              desc: "Foundation information and mission.",
              icon: Building2,
              color: "text-blue-600",
              bg: "bg-blue-50",
              ring: "ring-blue-50",
            },
            {
              step: "Step 2",
              title: "Verification & Trust",
              desc: "Legal registration and compliance.",
              icon: ShieldCheck,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              ring: "ring-emerald-50",
            },
            {
              step: "Step 3",
              title: "Causes & Programs",
              desc: "Areas of impact and initiatives.",
              icon: HeartHandshake,
              color: "text-purple-600",
              bg: "bg-purple-50",
              ring: "ring-purple-50",
            },
            {
              step: "Step 4",
              title: "Visibility & Growth",
              desc: "Become discoverable to supporters.",
              icon: BarChart3,
              color: "text-orange-600",
              bg: "bg-orange-50",
              ring: "ring-orange-50",
            },
          ].map((s, i) => (
            <div key={i} className="relative flex gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${s.bg} ${s.color} ring-4 ring-white`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div className="pt-0.5">
                <p className={`text-xs font-bold ${s.color}`}>{s.step}</p>
                <p className="mt-0.5 font-bold text-slate-900">{s.title}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-900">
              Profile Preview
            </p>
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-400">
                {liveLogoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={liveLogoPreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="h-8 w-8" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">
                  {initialProfile.displayName || "Your organization"}
                </h4>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {verificationLabel}
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-500">
                  {initialProfile.tagline ||
                    "Your mission and impact will appear here."}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {initialProfile.city && initialProfile.state
                ? `${initialProfile.city}, ${initialProfile.state}, ${initialProfile.countryCode}`
                : "Location pending"}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-900">
                  Primary Cause
                </p>
                <span className="inline-block rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                  {initialProfile.primaryCause
                    ? NGO_CAUSE_LABELS[
                        initialProfile.primaryCause as keyof typeof NGO_CAUSE_LABELS
                      ]
                    : "Pending"}
                </span>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-900">
                  Impact Areas
                </p>
                <div className="flex flex-wrap gap-2">
                  {initialProfile.impactAreas?.length ? (
                    initialProfile.impactAreas
                      .slice(0, 3)
                      .map((area: string) => (
                        <span
                          key={area}
                          className="inline-block rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600"
                        >
                          {area
                            .split("-")
                            .map((p) => p[0].toUpperCase() + p.slice(1))
                            .join(" ")}
                        </span>
                      ))
                  ) : (
                    <span className="text-xs font-medium text-slate-400">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-900">
                    Volunteer
                  </p>
                  <p className="text-[11px] font-medium text-slate-500">
                    Opportunities
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-900">
                    Fundraising
                  </p>
                  <p className="text-[11px] font-medium text-slate-500">
                    Campaigns
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 p-3 text-center">
            {ngoId && profileStatus === "published" ? (
              <a
                href={`/ngos/${ngoId}`}
                className="inline-flex min-h-8 items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                View Full Profile Preview <ArrowRight className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span
                className="inline-flex min-h-8 items-center text-xs font-bold text-slate-400"
                aria-disabled="true"
              >
                Publish to enable public preview
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* CENTER COLUMN: FORM */}
      <section className="min-w-0">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">Organization Setup</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Tell us about your organization
          </h2>
          <p className="mt-2 font-medium text-slate-600">
            Help supporters understand your mission and impact.
          </p>
        </div>

        {state.message && (
          <div
            role={state.status === "error" ? "alert" : "status"}
            className={`mb-6 rounded-xl border px-5 py-4 text-sm font-medium ${state.status === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
          >
            {state.message}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="step" value={step} />

          {sectionDefinitions.map((section, index) => {
            const sectionNumber = index + 1;
            const isExpanded = step === sectionNumber;
            const isCompleted = completedSections.has(sectionNumber);
            const Icon = section.icon;

            let headerColorClass = "bg-slate-50 text-slate-500";
            if (isCompleted)
              headerColorClass = "bg-emerald-50 text-emerald-600";
            else if (isExpanded) headerColorClass = "bg-blue-50 text-blue-600";

            return (
              <div
                key={sectionNumber}
                className={`overflow-hidden rounded-2xl border bg-white transition-all ${isExpanded ? "border-blue-600 shadow-md ring-1 ring-blue-600" : "border-slate-200 hover:border-slate-300"}`}
              >
                <button
                  type="button"
                  onClick={() => setStep(sectionNumber)}
                  aria-expanded={isExpanded}
                  aria-controls={`ngo-profile-section-${sectionNumber}`}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${headerColorClass}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {sectionNumber}. {section.title}
                      </h3>
                      <p className="mt-0.5 text-sm font-medium text-slate-500">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <div>
                    {isCompleted && !isExpanded ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <ChevronDown
                        className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div
                    id={`ngo-profile-section-${sectionNumber}`}
                    className="border-t border-slate-100 p-6 pt-6"
                  >
                    <div className="space-y-5">
                      {step === 1 && (
                        <>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <AssetUploader
                              name="logoPath"
                              label="Organization logo"
                              assetType="logo"
                              initialPath={initialProfile.logoPath}
                              onPreviewChange={setLiveLogoPreview}
                              onUploaded={({ path }) => trackPendingAsset(path)}
                              onDiscarded={forgetPendingAsset}
                              onBusyChange={(busy) =>
                                setAssetUploadsInFlight((current) =>
                                  Math.max(0, current + (busy ? 1 : -1)),
                                )
                              }
                            />
                            <AssetUploader
                              name="coverImagePath"
                              label="Cover image"
                              assetType="cover"
                              initialPath={initialProfile.coverImagePath}
                              onUploaded={({ path }) => trackPendingAsset(path)}
                              onDiscarded={forgetPendingAsset}
                              onBusyChange={(busy) =>
                                setAssetUploadsInFlight((current) =>
                                  Math.max(0, current + (busy ? 1 : -1)),
                                )
                              }
                            />
                          </div>
                          <div>
                            <label htmlFor="legalName" className={labelClass}>
                              Registered legal name *
                            </label>
                            <input
                              id="legalName"
                              name="legalName"
                              defaultValue={initialProfile.legalName ?? ""}
                              className={fieldClass}
                              maxLength={180}
                            />
                            <FieldError
                              name="legalName"
                              errors={state.fieldErrors}
                            />
                          </div>
                          <div>
                            <label htmlFor="displayName" className={labelClass}>
                              Public display name *
                            </label>
                            <input
                              id="displayName"
                              name="displayName"
                              defaultValue={initialProfile.displayName ?? ""}
                              className={fieldClass}
                              maxLength={150}
                            />
                            <FieldError
                              name="displayName"
                              errors={state.fieldErrors}
                            />
                          </div>
                          <div>
                            <label htmlFor="tagline" className={labelClass}>
                              Tagline *
                            </label>
                            <input
                              id="tagline"
                              name="tagline"
                              defaultValue={initialProfile.tagline ?? ""}
                              className={fieldClass}
                              maxLength={180}
                            />
                            <FieldError
                              name="tagline"
                              errors={state.fieldErrors}
                            />
                          </div>
                          <div>
                            <label htmlFor="description" className={labelClass}>
                              About the organization *
                            </label>
                            <textarea
                              id="description"
                              name="description"
                              defaultValue={initialProfile.description ?? ""}
                              rows={5}
                              className={fieldClass}
                              maxLength={2000}
                            />
                            <FieldError
                              name="description"
                              errors={state.fieldErrors}
                            />
                          </div>
                          <div>
                            <label htmlFor="mission" className={labelClass}>
                              Mission *
                            </label>
                            <textarea
                              id="mission"
                              name="mission"
                              defaultValue={initialProfile.mission ?? ""}
                              rows={3}
                              className={fieldClass}
                              maxLength={1000}
                            />
                            <FieldError
                              name="mission"
                              errors={state.fieldErrors}
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="foundingYear"
                                className={labelClass}
                              >
                                Founding year *
                              </label>
                              <input
                                id="foundingYear"
                                name="foundingYear"
                                type="number"
                                min="1800"
                                max={new Date().getFullYear()}
                                defaultValue={initialProfile.foundingYear ?? ""}
                                className={fieldClass}
                              />
                              <FieldError
                                name="foundingYear"
                                errors={state.fieldErrors}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="organizationType"
                                className={labelClass}
                              >
                                Organization type *
                              </label>
                              <select
                                id="organizationType"
                                name="organizationType"
                                defaultValue={
                                  initialProfile.organizationType ?? ""
                                }
                                className={fieldClass}
                              >
                                <option value="">Select type</option>
                                {ORGANIZATION_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type
                                      .split("-")
                                      .map(
                                        (part) =>
                                          part[0].toUpperCase() + part.slice(1),
                                      )
                                      .join(" ")}
                                  </option>
                                ))}
                              </select>
                              <FieldError
                                name="organizationType"
                                errors={state.fieldErrors}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {step === 2 && (
                        <>
                          <div>
                            <label
                              htmlFor="addressLine1"
                              className={labelClass}
                            >
                              Address line 1 *
                            </label>
                            <input
                              id="addressLine1"
                              name="addressLine1"
                              defaultValue={initialProfile.addressLine1 ?? ""}
                              className={fieldClass}
                              maxLength={200}
                            />
                            <FieldError
                              name="addressLine1"
                              errors={state.fieldErrors}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="addressLine2"
                              className={labelClass}
                            >
                              Address line 2
                            </label>
                            <input
                              id="addressLine2"
                              name="addressLine2"
                              defaultValue={initialProfile.addressLine2 ?? ""}
                              className={fieldClass}
                              maxLength={200}
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label htmlFor="city" className={labelClass}>
                                City *
                              </label>
                              <input
                                id="city"
                                name="city"
                                defaultValue={initialProfile.city ?? ""}
                                className={fieldClass}
                                maxLength={100}
                              />
                              <FieldError
                                name="city"
                                errors={state.fieldErrors}
                              />
                            </div>
                            <div>
                              <label htmlFor="state" className={labelClass}>
                                State *
                              </label>
                              <input
                                id="state"
                                name="state"
                                defaultValue={initialProfile.state ?? ""}
                                className={fieldClass}
                                maxLength={100}
                              />
                              <FieldError
                                name="state"
                                errors={state.fieldErrors}
                              />
                            </div>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="postalCode"
                                className={labelClass}
                              >
                                Postal code *
                              </label>
                              <input
                                id="postalCode"
                                name="postalCode"
                                defaultValue={initialProfile.postalCode ?? ""}
                                className={fieldClass}
                                maxLength={20}
                              />
                              <FieldError
                                name="postalCode"
                                errors={state.fieldErrors}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="countryCode"
                                className={labelClass}
                              >
                                Country code *
                              </label>
                              <input
                                id="countryCode"
                                name="countryCode"
                                defaultValue={
                                  initialProfile.countryCode ?? "IN"
                                }
                                className={fieldClass}
                                maxLength={2}
                              />
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  Map coordinates
                                </p>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                  Use your device location or enter coordinates
                                  manually.
                                </p>
                                <p className="mt-1 text-[11px] font-medium text-slate-400">
                                  If no popup appears, check the site
                                  controls/lock icon or Brave privacy settings.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={detectCurrentLocation}
                                disabled={
                                  locationDetectionState === "detecting"
                                }
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {locationDetectionState === "detecting" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <LocateFixed className="h-4 w-4" />
                                )}
                                {locationDetectionState === "detecting"
                                  ? "Detecting..."
                                  : "Use my current location"}
                              </button>
                            </div>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              <div>
                                <label
                                  htmlFor="latitude"
                                  className={labelClass}
                                >
                                  Latitude
                                </label>
                                <input
                                  id="latitude"
                                  name="latitude"
                                  type="number"
                                  step="any"
                                  min="-90"
                                  max="90"
                                  value={latitude}
                                  onChange={(event) => {
                                    setLatitude(event.target.value);
                                    setLocationDetectionState("idle");
                                    setLocationMessage("");
                                  }}
                                  className={fieldClass}
                                  inputMode="decimal"
                                />
                                <FieldError
                                  name="latitude"
                                  errors={state.fieldErrors}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="longitude"
                                  className={labelClass}
                                >
                                  Longitude
                                </label>
                                <input
                                  id="longitude"
                                  name="longitude"
                                  type="number"
                                  step="any"
                                  min="-180"
                                  max="180"
                                  value={longitude}
                                  onChange={(event) => {
                                    setLongitude(event.target.value);
                                    setLocationDetectionState("idle");
                                    setLocationMessage("");
                                  }}
                                  className={fieldClass}
                                  inputMode="decimal"
                                />
                              </div>
                            </div>
                            {locationMessage && (
                              <p
                                className={`mt-3 flex items-start gap-2 text-xs font-semibold ${
                                  locationDetectionState === "error"
                                    ? "text-red-600"
                                    : locationDetectionState === "success"
                                      ? "text-emerald-700"
                                      : "text-slate-500"
                                }`}
                                role={
                                  locationDetectionState === "error"
                                    ? "alert"
                                    : "status"
                                }
                                aria-live="polite"
                              >
                                {locationDetectionState === "error" && (
                                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                )}
                                {locationDetectionState === "success" && (
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                )}
                                {locationDetectionState === "detecting" && (
                                  <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
                                )}
                                <span>{locationMessage}</span>
                              </p>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-500">
                            Coordinates are optional. Profiles without them will
                            not appear on the map.
                          </p>
                        </>
                      )}

                      {step === 3 && (
                        <>
                          <div>
                            <label
                              htmlFor="primaryCause"
                              className={labelClass}
                            >
                              Primary cause *
                            </label>
                            <select
                              id="primaryCause"
                              name="primaryCause"
                              defaultValue={initialProfile.primaryCause ?? ""}
                              className={fieldClass}
                            >
                              <option value="">Select a cause</option>
                              {NGO_CAUSES.map((cause) => (
                                <option key={cause} value={cause}>
                                  {NGO_CAUSE_LABELS[cause]}
                                </option>
                              ))}
                            </select>
                            <FieldError
                              name="primaryCause"
                              errors={state.fieldErrors}
                            />
                          </div>
                          <fieldset>
                            <legend className={labelClass}>
                              Impact areas *
                            </legend>
                            <CheckGrid
                              name="impactAreas"
                              values={IMPACT_AREAS}
                              selected={initialProfile.impactAreas ?? []}
                            />
                            <FieldError
                              name="impactAreas"
                              errors={state.fieldErrors}
                            />
                          </fieldset>
                          <fieldset>
                            <legend className={labelClass}>
                              Beneficiary groups *
                            </legend>
                            <CheckGrid
                              name="beneficiaryGroups"
                              values={BENEFICIARY_GROUPS}
                              selected={initialProfile.beneficiaryGroups ?? []}
                            />
                            <FieldError
                              name="beneficiaryGroups"
                              errors={state.fieldErrors}
                            />
                          </fieldset>
                          <div>
                            <label
                              htmlFor="programSummary"
                              className={labelClass}
                            >
                              Programs and initiatives *
                            </label>
                            <textarea
                              id="programSummary"
                              name="programSummary"
                              defaultValue={initialProfile.programSummary ?? ""}
                              rows={4}
                              className={fieldClass}
                              maxLength={1500}
                            />
                            <FieldError
                              name="programSummary"
                              errors={state.fieldErrors}
                            />
                          </div>
                          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                            <p className="text-sm font-bold text-slate-900">
                              Public profile story
                            </p>
                            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                              These optional fields power the richer public NGO
                              page. Campaigns, gallery photos, and latest
                              updates will be managed from the NGO dashboard
                              later.
                            </p>
                          </div>
                          <div>
                            <label htmlFor="vision" className={labelClass}>
                              Vision
                            </label>
                            <textarea
                              id="vision"
                              name="vision"
                              defaultValue={initialProfile.vision ?? ""}
                              rows={3}
                              className={fieldClass}
                              maxLength={1000}
                              placeholder="What long-term change is your organization working toward?"
                            />
                            <FieldError
                              name="vision"
                              errors={state.fieldErrors}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="theoryOfChange"
                              className={labelClass}
                            >
                              Theory of change
                            </label>
                            <textarea
                              id="theoryOfChange"
                              name="theoryOfChange"
                              defaultValue={initialProfile.theoryOfChange ?? ""}
                              rows={3}
                              className={fieldClass}
                              maxLength={1200}
                              placeholder="Briefly explain how your work creates measurable change."
                            />
                            <FieldError
                              name="theoryOfChange"
                              errors={state.fieldErrors}
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="coreValues"
                                className={labelClass}
                              >
                                Core values
                              </label>
                              <textarea
                                id="coreValues"
                                name="coreValues"
                                defaultValue={listToTextareaValue(
                                  initialProfile.coreValues,
                                )}
                                rows={4}
                                className={fieldClass}
                                maxLength={700}
                                placeholder="One value per line, e.g.&#10;Integrity&#10;Inclusion&#10;Transparency"
                              />
                              <p className="mt-1.5 text-xs font-medium text-slate-500">
                                Use one value per line or comma-separated
                                values.
                              </p>
                              <FieldError
                                name="coreValues"
                                errors={state.fieldErrors}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="operatingStates"
                                className={labelClass}
                              >
                                Operating states / regions
                              </label>
                              <textarea
                                id="operatingStates"
                                name="operatingStates"
                                defaultValue={listToTextareaValue(
                                  initialProfile.operatingStates,
                                )}
                                rows={4}
                                className={fieldClass}
                                maxLength={700}
                                placeholder="One region per line, e.g.&#10;Rajasthan&#10;Uttar Pradesh&#10;Madhya Pradesh"
                              />
                              <p className="mt-1.5 text-xs font-medium text-slate-500">
                                Used for the “Where we work” section until
                                detailed service areas are managed in the
                                dashboard.
                              </p>
                              <FieldError
                                name="operatingStates"
                                errors={state.fieldErrors}
                              />
                            </div>
                          </div>
                          <div>
                            <p className={labelClass}>Public impact totals</p>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <div>
                                <label
                                  htmlFor="teamSize"
                                  className="mb-1.5 block text-xs font-bold text-slate-600"
                                >
                                  Team size
                                </label>
                                <input
                                  id="teamSize"
                                  name="teamSize"
                                  type="number"
                                  min="0"
                                  step="1"
                                  defaultValue={initialProfile.teamSize ?? ""}
                                  className={fieldClass}
                                  inputMode="numeric"
                                />
                                <FieldError
                                  name="teamSize"
                                  errors={state.fieldErrors}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="beneficiariesReached"
                                  className="mb-1.5 block text-xs font-bold text-slate-600"
                                >
                                  Beneficiaries reached
                                </label>
                                <input
                                  id="beneficiariesReached"
                                  name="beneficiariesReached"
                                  type="number"
                                  min="0"
                                  step="1"
                                  defaultValue={
                                    initialProfile.beneficiariesReached ?? ""
                                  }
                                  className={fieldClass}
                                  inputMode="numeric"
                                />
                                <FieldError
                                  name="beneficiariesReached"
                                  errors={state.fieldErrors}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="communitiesServed"
                                  className="mb-1.5 block text-xs font-bold text-slate-600"
                                >
                                  Communities served
                                </label>
                                <input
                                  id="communitiesServed"
                                  name="communitiesServed"
                                  type="number"
                                  min="0"
                                  step="1"
                                  defaultValue={
                                    initialProfile.communitiesServed ?? ""
                                  }
                                  className={fieldClass}
                                  inputMode="numeric"
                                />
                                <FieldError
                                  name="communitiesServed"
                                  errors={state.fieldErrors}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="volunteersEngaged"
                                  className="mb-1.5 block text-xs font-bold text-slate-600"
                                >
                                  Volunteers engaged
                                </label>
                                <input
                                  id="volunteersEngaged"
                                  name="volunteersEngaged"
                                  type="number"
                                  min="0"
                                  step="1"
                                  defaultValue={
                                    initialProfile.volunteersEngaged ?? ""
                                  }
                                  className={fieldClass}
                                  inputMode="numeric"
                                />
                                <FieldError
                                  name="volunteersEngaged"
                                  errors={state.fieldErrors}
                                />
                              </div>
                            </div>
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              Enter verified lifetime or current totals only.
                              Leave blank if you do not want a metric shown
                              publicly.
                            </p>
                          </div>
                        </>
                      )}

                      {step === 4 && (
                        <>
                          <div className="rounded-lg bg-slate-50 p-4 text-sm font-medium text-slate-700">
                            Current status:{" "}
                            <strong className="text-slate-900">
                              {verificationStatus.replace("-", " ")}
                            </strong>
                            . Legal details and documents are never shown
                            publicly.
                          </div>
                          <div>
                            <label
                              htmlFor="verificationLegalName"
                              className={labelClass}
                            >
                              Registered legal name *
                            </label>
                            <input
                              id="verificationLegalName"
                              name="verificationLegalName"
                              defaultValue={
                                verification?.legal_name ??
                                initialProfile.legalName ??
                                ""
                              }
                              className={fieldClass}
                              disabled={
                                verificationStatus === "pending" ||
                                verificationStatus === "verified"
                              }
                            />
                            <FieldError
                              name="verificationLegalName"
                              errors={state.fieldErrors}
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="registrationNumber"
                                className={labelClass}
                              >
                                Registration number *
                              </label>
                              <input
                                id="registrationNumber"
                                name="registrationNumber"
                                defaultValue={
                                  verification?.registration_number ?? ""
                                }
                                className={fieldClass}
                                disabled={
                                  verificationStatus === "pending" ||
                                  verificationStatus === "verified"
                                }
                              />
                              <FieldError
                                name="registrationNumber"
                                errors={state.fieldErrors}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="registrationType"
                                className={labelClass}
                              >
                                Registration type *
                              </label>
                              <select
                                id="registrationType"
                                name="registrationType"
                                defaultValue={
                                  verification?.registration_type ?? ""
                                }
                                className={fieldClass}
                                disabled={
                                  verificationStatus === "pending" ||
                                  verificationStatus === "verified"
                                }
                              >
                                <option value="">Select type</option>
                                <option value="trust">Trust</option>
                                <option value="society">Society</option>
                                <option value="section-8-company">
                                  Section 8 company
                                </option>
                                <option value="other">Other</option>
                              </select>
                              <FieldError
                                name="registrationType"
                                errors={state.fieldErrors}
                              />
                            </div>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="registrationDate"
                                className={labelClass}
                              >
                                Registration date
                              </label>
                              <input
                                id="registrationDate"
                                name="registrationDate"
                                type="date"
                                defaultValue={
                                  verification?.registration_date ?? ""
                                }
                                className={fieldClass}
                                disabled={
                                  verificationStatus === "pending" ||
                                  verificationStatus === "verified"
                                }
                              />
                            </div>
                            <div>
                              <label htmlFor="panNumber" className={labelClass}>
                                PAN
                              </label>
                              <input
                                id="panNumber"
                                name="panNumber"
                                defaultValue={verification?.pan_number ?? ""}
                                className={fieldClass}
                                maxLength={10}
                                disabled={
                                  verificationStatus === "pending" ||
                                  verificationStatus === "verified"
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="ngoDarpanId" className={labelClass}>
                              NGO Darpan ID
                            </label>
                            <input
                              id="ngoDarpanId"
                              name="ngoDarpanId"
                              defaultValue={verification?.ngo_darpan_id ?? ""}
                              className={fieldClass}
                              disabled={
                                verificationStatus === "pending" ||
                                verificationStatus === "verified"
                              }
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="registeredAddress"
                              className={labelClass}
                            >
                              Registered address
                            </label>
                            <textarea
                              id="registeredAddress"
                              name="registeredAddress"
                              defaultValue={
                                verification?.registered_address ?? ""
                              }
                              rows={3}
                              className={fieldClass}
                              disabled={
                                verificationStatus === "pending" ||
                                verificationStatus === "verified"
                              }
                            />
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {[
                              [
                                "has12a",
                                "12A registered",
                                verification?.has_12a,
                              ],
                              ["has80g", "80G approved", verification?.has_80g],
                              [
                                "hasFcra",
                                "FCRA registered",
                                verification?.has_fcra,
                              ],
                            ].map(([name, label, value]) => (
                              <label
                                key={String(name)}
                                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  name={String(name)}
                                  defaultChecked={Boolean(value)}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                  disabled={
                                    verificationStatus === "pending" ||
                                    verificationStatus === "verified"
                                  }
                                />{" "}
                                {String(label)}
                              </label>
                            ))}
                          </div>
                          <VerificationDocuments
                            verificationId={
                              state.verificationId ?? verification?.id
                            }
                            initialDocuments={initialDocuments}
                            disabled={
                              verificationStatus === "pending" ||
                              verificationStatus === "verified"
                            }
                          />
                        </>
                      )}

                      {step === 5 && (
                        <>
                          <div>
                            <label htmlFor="websiteUrl" className={labelClass}>
                              Website
                            </label>
                            <input
                              id="websiteUrl"
                              name="websiteUrl"
                              type="text"
                              inputMode="url"
                              defaultValue={initialProfile.websiteUrl ?? ""}
                              className={fieldClass}
                              placeholder="https://example.org"
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="publicEmail"
                                className={labelClass}
                              >
                                Public email
                              </label>
                              <input
                                id="publicEmail"
                                name="publicEmail"
                                type="email"
                                defaultValue={initialProfile.publicEmail ?? ""}
                                className={fieldClass}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="publicPhone"
                                className={labelClass}
                              >
                                Public phone
                              </label>
                              <input
                                id="publicPhone"
                                name="publicPhone"
                                type="tel"
                                defaultValue={initialProfile.publicPhone ?? ""}
                                className={fieldClass}
                              />
                            </div>
                          </div>
                          {[
                            ["facebookUrl", "Facebook", social.facebook],
                            ["instagramUrl", "Instagram", social.instagram],
                            ["linkedinUrl", "LinkedIn", social.linkedin],
                            ["youtubeUrl", "YouTube", social.youtube],
                          ].map(([name, label, value]) => (
                            <div key={name}>
                              <label htmlFor={name} className={labelClass}>
                                {label}
                              </label>
                              <input
                                id={name}
                                name={name}
                                defaultValue={value ?? ""}
                                className={fieldClass}
                                inputMode="url"
                              />
                            </div>
                          ))}
                        </>
                      )}

                      {step === 6 && (
                        <fieldset className="space-y-3">
                          <legend className={labelClass}>
                            Visibility preferences
                          </legend>
                          {[
                            [
                              "isDiscoverable",
                              "Show this profile in the NGO directory and search",
                              initialProfile.isDiscoverable,
                            ],
                            [
                              "acceptsDonations",
                              "Show donation actions on the public profile",
                              initialProfile.acceptsDonations,
                            ],
                            [
                              "acceptsVolunteers",
                              "Show volunteer availability on the public profile",
                              initialProfile.acceptsVolunteers,
                            ],
                          ].map(([name, label, value]) => (
                            <label
                              key={String(name)}
                              className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <input
                                type="checkbox"
                                name={String(name)}
                                defaultChecked={value !== false}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                              />
                              <span>{String(label)}</span>
                            </label>
                          ))}
                        </fieldset>
                      )}
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
                      {step === 4 &&
                        verificationStatus !== "pending" &&
                        verificationStatus !== "verified" && (
                          <button
                            type="submit"
                            name="intent"
                            value="submit-verification"
                            disabled={submitDisabled}
                            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-blue-600 px-6 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-75"
                          >
                            <PendingButtonContent
                              idle="Submit verification"
                              pending={pending}
                              uploadPending={assetUploadPending}
                            />
                          </button>
                        )}
                      {step < 6 ? (
                        <button
                          type="submit"
                          name="intent"
                          value="next"
                          disabled={submitDisabled}
                          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:opacity-90"
                        >
                          <PendingButtonContent
                            idle="Save and continue"
                            pending={pending}
                            uploadPending={assetUploadPending}
                          />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          name="intent"
                          value="next"
                          disabled={submitDisabled}
                          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:opacity-90"
                        >
                          <PendingButtonContent
                            idle="Save section"
                            pending={pending}
                            uploadPending={assetUploadPending}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-4">
            <button
              type="submit"
              name="intent"
              value="save"
              disabled={submitDisabled}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-8 font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-75 sm:w-auto"
            >
              <PendingButtonContent
                idle={
                  <>
                    <Bookmark className="h-5 w-5" /> Save Draft
                  </>
                }
                pending={pending}
                uploadPending={assetUploadPending}
              />
            </button>
            <button
              type="submit"
              name="intent"
              value="publish"
              disabled={submitDisabled}
              className="flex min-h-[52px] w-full flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-600 disabled:opacity-90 sm:w-auto"
            >
              <PendingButtonContent
                idle={
                  <>
                    {profileStatus === "published"
                      ? "Update Organization Profile"
                      : "Create Organization Profile"}{" "}
                    <ArrowRight className="h-5 w-5" />
                  </>
                }
                pending={pending}
                uploadPending={assetUploadPending}
              />
            </button>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
            <Lock className="h-3.5 w-3.5" /> Your information is secure and will
            never be shared without your permission.
          </p>
        </form>
      </section>

      {/* RIGHT COLUMN: PROGRESS & HELP */}
      <aside className="hidden space-y-6 lg:sticky lg:top-8 lg:block lg:self-start">
        <div>
          <h3 className="font-bold text-slate-900">Setup Progress</h3>
          <div className="mt-6 flex flex-col items-center">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-[10px] border-slate-100">
              <svg
                className="absolute inset-0 h-full w-full -rotate-90 transform"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-blue-600 transition-all duration-500"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-2xl font-bold text-slate-900">
                  {progressPercentage}%
                </span>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Complete
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4 px-2">
            {sectionDefinitions.map((section, index) => {
              const sectionNumber = index + 1;
              const isCompleted = completedSections.has(sectionNumber);
              const isActive = step === sectionNumber;

              return (
                <div key={sectionNumber} className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 shrink-0 rounded-full ${isCompleted ? "bg-blue-600 ring-4 ring-blue-50" : isActive ? "bg-blue-600 ring-4 ring-blue-50" : "bg-slate-200"}`}
                  />
                  <span
                    className={`text-sm font-semibold ${isActive || isCompleted ? "text-blue-600" : "text-slate-500"}`}
                  >
                    {section.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <h4 className="font-bold text-slate-900">Need Help?</h4>
          <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">
            Our team is here to help you set up your organization profile.
          </p>
          <button
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-bold text-blue-600 shadow-sm hover:bg-slate-50"
          >
            <Headset className="h-4 w-4" /> Contact Support
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="font-bold text-slate-900">Why quality matters?</h4>
          <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">
            A complete profile builds trust, attracts more supporters, and
            creates greater impact.
          </p>
          <a
            href="#"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Learn More <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </aside>
    </div>
  );
}
