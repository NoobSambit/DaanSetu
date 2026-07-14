import { NextResponse } from "next/server";
import { z } from "zod";

import { decryptSensitiveBytes } from "@/lib/security/encryption";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  campaignId: z.string().uuid(),
  index: z.coerce.number().int().min(0).max(20),
});

type EvidenceMetadata = {
  id: string;
  storagePath: string;
  originalName: string;
  mimeType: string;
  encryptionVersion?: number;
};

function safeFilename(value: string) {
  return value.replaceAll(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ campaignId: string; index: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid evidence file" },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("campaigns")
    .select("evidence")
    .eq("id", parsed.data.campaignId)
    .maybeSingle();
  const evidence = Array.isArray(campaign?.evidence)
    ? (campaign.evidence[parsed.data.index] as EvidenceMetadata | undefined)
    : undefined;
  if (!evidence?.id || !evidence.storagePath || !evidence.originalName) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }

  const { data: stored, error } = await admin.storage
    .from("campaign-evidence")
    .download(evidence.storagePath);
  if (error || !stored) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }

  try {
    const storedBytes = new Uint8Array(await stored.arrayBuffer());
    const bytes =
      evidence.encryptionVersion === 1
        ? decryptSensitiveBytes(
            storedBytes,
            `campaign-evidence:${parsed.data.campaignId}:${evidence.id}`,
          )
        : storedBytes;

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${safeFilename(evidence.originalName)}"`,
        "Content-Type": evidence.mimeType || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Evidence could not be opened" },
      { status: 500 },
    );
  }
}
