import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { hasValidRequestOrigin } from "@/lib/security/origin";
import { validatePublicImage } from "@/lib/storage/file-validation";
import { createServerClient } from "@/lib/supabase/server";

const COMMUNITY_BUCKET = "community-media";
const deleteSchema = z.object({
  path: z.string().min(1).max(500),
});

const extensions = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

async function verifiedUser(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return { error: "Invalid request origin", status: 403 } as const;
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    return { error: "Verified authentication required", status: 401 } as const;
  }

  return { supabase, user } as const;
}

async function uploadHandler(request: NextRequest) {
  const auth = await verifiedUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "An image is required" },
      { status: 400 },
    );
  }

  try {
    await validatePublicImage(file);
  } catch {
    return NextResponse.json(
      { error: "Image extension, MIME type, size, and content must match" },
      { status: 400 },
    );
  }

  const extension = extensions.get(file.type);
  if (!extension) {
    return NextResponse.json({ error: "Unsupported image" }, { status: 400 });
  }

  const path = `${auth.user.id}/${randomUUID()}.${extension}`;
  const { error } = await auth.supabase.storage
    .from(COMMUNITY_BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });
  if (error) {
    return NextResponse.json(
      { error: "The community image could not be stored" },
      { status: 500 },
    );
  }

  const { data } = auth.supabase.storage
    .from(COMMUNITY_BUCKET)
    .getPublicUrl(path);
  return NextResponse.json({ path, url: data.publicUrl });
}

async function deleteHandler(request: NextRequest) {
  const auth = await verifiedUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
  }
  if (!parsed.data.path.startsWith(`${auth.user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await auth.supabase.storage
    .from(COMMUNITY_BUCKET)
    .remove([parsed.data.path]);
  if (error) {
    return NextResponse.json(
      { error: "The community image could not be removed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

export const POST = rateLimit(RATE_LIMITS.UPLOAD)(uploadHandler);
export const DELETE = rateLimit(RATE_LIMITS.UPLOAD)(deleteHandler);
