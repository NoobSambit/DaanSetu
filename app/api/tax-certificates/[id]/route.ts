import { NextRequest, NextResponse } from "next/server";

import { decryptSensitiveBytes } from "@/lib/security/encryption";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

  const admin = createAdminClient();
  const [{ data: profile }, { data: certificate }] = await Promise.all([
    admin.from("users").select("role").eq("id", user.id).maybeSingle(),
    admin
      .from("tax_certificates")
      .select(
        "id, ngo_id, donation_id, certificate_number, storage_path, encryption_version",
      )
      .eq("id", id)
      .maybeSingle(),
  ]);
  if (!certificate) {
    return NextResponse.json(
      { error: "Certificate not found" },
      { status: 404 },
    );
  }
  const [{ data: donation }, { data: ngo }] = await Promise.all([
    admin
      .from("donations")
      .select("user_id")
      .eq("id", certificate.donation_id)
      .maybeSingle(),
    admin
      .from("ngos")
      .select("user_id")
      .eq("id", certificate.ngo_id)
      .maybeSingle(),
  ]);
  const isAdmin = profile?.role === "admin";
  if (donation?.user_id !== user.id && ngo?.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: storedFile, error } = await admin.storage
    .from("tax-certificates")
    .download(certificate.storage_path);
  if (error || !storedFile) {
    return NextResponse.json(
      { error: "Certificate could not be loaded" },
      { status: 500 },
    );
  }
  let bytes: Uint8Array<ArrayBufferLike> = new Uint8Array(
    await storedFile.arrayBuffer(),
  );
  if (certificate.encryption_version === 1) {
    try {
      bytes = decryptSensitiveBytes(bytes, `tax-certificate:${certificate.id}`);
    } catch {
      return NextResponse.json(
        { error: "Certificate could not be decrypted" },
        { status: 500 },
      );
    }
  }
  const safeNumber = certificate.certificate_number.replace(
    /[^a-zA-Z0-9._-]/g,
    "_",
  );
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Form-10BE-${safeNumber}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
