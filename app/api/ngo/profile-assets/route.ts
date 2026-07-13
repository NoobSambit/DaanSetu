import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { getUserRole } from "@/lib/auth/profile";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function storageErrorResponse(
  action: "upload" | "delete",
  error: { message?: string; error?: string; statusCode?: string | number },
) {
  const details = [error.message, error.error, String(error.statusCode ?? "")]
    .filter(Boolean)
    .join(" ");
  const normalizedDetails = details.toLowerCase();
  const operation = action === "upload" ? "upload" : "deletion";
  let message = `Image ${operation} failed. Please try again.`;

  if (
    normalizedDetails.includes("bucket") &&
    normalizedDetails.includes("not found")
  ) {
    message =
      "Image storage is not configured. Run the NGO profile storage migration.";
  } else if (
    normalizedDetails.includes("row-level security") ||
    normalizedDetails.includes("unauthorized") ||
    normalizedDetails.includes("forbidden")
  ) {
    message = "Image storage permissions are not configured for this account.";
  }

  console.error(`NGO profile asset ${operation} failed`, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

async function handler(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || (await getUserRole(supabase, user.id)) !== "ngo") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const assetType = formData.get("assetType");
  if (
    !(file instanceof File) ||
    (assetType !== "logo" && assetType !== "cover")
  ) {
    return NextResponse.json(
      { error: "A valid image and asset type are required." },
      { status: 400 },
    );
  }

  const extension = allowedTypes.get(file.type);
  if (
    !extension ||
    !["jpg", "jpeg", "png", "webp"].includes(
      file.name.toLowerCase().split(".").pop() ?? "",
    )
  ) {
    return NextResponse.json(
      { error: "Upload a JPEG, PNG, or WebP image." },
      { status: 400 },
    );
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Image size must not exceed 5 MB." },
      { status: 400 },
    );
  }

  const path = `${user.id}/${assetType}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("ngos")
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });
  if (error) return storageErrorResponse("upload", error);

  const { data } = supabase.storage.from("ngos").getPublicUrl(path);
  return NextResponse.json({ path, url: data.publicUrl });
}

export const POST = rateLimit(RATE_LIMITS.UPLOAD)(handler);

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const path = typeof body.path === "string" ? body.path : "";
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { error } = await supabase.storage.from("ngos").remove([path]);
  if (error) return storageErrorResponse("delete", error);
  return NextResponse.json({ success: true });
}
