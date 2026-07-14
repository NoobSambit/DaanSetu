import { NextRequest, NextResponse } from "next/server";

import { decryptSensitiveBytes } from "@/lib/security/encryption";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: document } = await admin
    .from("ngo_verification_documents")
    .select("id, storage_path, original_name, mime_type, encryption_version")
    .eq("id", id)
    .maybeSingle();
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  const { data: storedFile, error } = await admin.storage
    .from("ngo-verification")
    .download(document.storage_path);
  if (error || !storedFile) {
    return NextResponse.json(
      { error: "Document could not be loaded" },
      { status: 500 },
    );
  }

  let bytes: Uint8Array<ArrayBufferLike> = new Uint8Array(
    await storedFile.arrayBuffer(),
  );
  if (document.encryption_version === 1) {
    try {
      bytes = decryptSensitiveBytes(
        bytes,
        `ngo-verification-document:${document.id}`,
      );
    } catch {
      return NextResponse.json(
        { error: "Document could not be decrypted" },
        { status: 500 },
      );
    }
  }
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": document.mime_type,
      "Content-Disposition": `attachment; filename="${safeFilename(document.original_name)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
