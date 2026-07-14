import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { validateVerificationDocument } from "@/lib/ngo/profile";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { hasValidRequestOrigin } from "@/lib/security/origin";
import { encryptSensitiveBytes } from "@/lib/security/encryption";
import { validatePrivateDocument } from "@/lib/storage/file-validation";
import { createClient } from "@/lib/supabase/server";

const documentTypes = new Set([
  "registration",
  "pan",
  "12a",
  "80g",
  "fcra",
  "supporting",
]);
async function handler(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const verificationId = formData.get("verificationId");
  const documentType = formData.get("documentType");
  if (
    !(file instanceof File) ||
    typeof verificationId !== "string" ||
    typeof documentType !== "string"
  ) {
    return NextResponse.json(
      { error: "File, verification, and document type are required." },
      { status: 400 },
    );
  }
  if (!documentTypes.has(documentType)) {
    return NextResponse.json(
      { error: "Invalid document type." },
      { status: 400 },
    );
  }
  const validationError = validateVerificationDocument(file);
  if (validationError)
    return NextResponse.json({ error: validationError }, { status: 400 });
  try {
    await validatePrivateDocument(file);
  } catch {
    return NextResponse.json(
      { error: "Document content does not match its declared file type." },
      { status: 400 },
    );
  }

  const { data: verification } = await supabase
    .from("ngo_verifications")
    .select("id, ngo_id, verification_status, ngo:ngos!inner(user_id)")
    .eq("id", verificationId)
    .maybeSingle();
  const ownerId = (verification?.ngo as unknown as { user_id?: string } | null)
    ?.user_id;
  if (
    !verification ||
    ownerId !== user.id ||
    !["draft", "rejected"].includes(verification.verification_status)
  ) {
    return NextResponse.json(
      { error: "Verification draft is not editable." },
      { status: 403 },
    );
  }

  const documentId = randomUUID();
  const path = `${verification.ngo_id}/${verification.id}/${documentId}.encrypted`;
  const encryptedBytes = encryptSensitiveBytes(
    new Uint8Array(await file.arrayBuffer()),
    `ngo-verification-document:${documentId}`,
  );
  const { error: uploadError } = await supabase.storage
    .from("ngo-verification")
    .upload(path, encryptedBytes, {
      contentType: "application/octet-stream",
      upsert: false,
    });
  if (uploadError)
    return NextResponse.json(
      { error: "Document upload failed." },
      { status: 500 },
    );

  const { data: document, error: insertError } = await supabase
    .from("ngo_verification_documents")
    .insert({
      id: documentId,
      verification_id: verification.id,
      ngo_id: verification.ngo_id,
      document_type: documentType,
      storage_path: path,
      original_name: file.name.slice(0, 255),
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: user.id,
      encryption_version: 1,
      encrypted_at: new Date().toISOString(),
    })
    .select("id, document_type, original_name, size_bytes, created_at")
    .single();

  if (insertError || !document) {
    await supabase.storage.from("ngo-verification").remove([path]);
    return NextResponse.json(
      { error: "Document metadata could not be saved." },
      { status: 500 },
    );
  }
  return NextResponse.json({ document });
}

export const POST = rateLimit(RATE_LIMITS.UPLOAD)(handler);

export async function DELETE(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const documentId = typeof body.documentId === "string" ? body.documentId : "";

  const { data: document } = await supabase
    .from("ngo_verification_documents")
    .select("id, storage_path, verification_id, ngo:ngos!inner(user_id)")
    .eq("id", documentId)
    .maybeSingle();
  const ownerId = (document?.ngo as unknown as { user_id?: string } | null)
    ?.user_id;
  if (!document || ownerId !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: verification } = await supabase
    .from("ngo_verifications")
    .select("verification_status")
    .eq("id", document.verification_id)
    .single();
  if (
    !verification ||
    !["draft", "rejected"].includes(verification.verification_status)
  ) {
    return NextResponse.json(
      { error: "Submitted documents cannot be deleted." },
      { status: 409 },
    );
  }

  const { error: storageError } = await supabase.storage
    .from("ngo-verification")
    .remove([document.storage_path]);
  if (storageError)
    return NextResponse.json(
      { error: "Document deletion failed." },
      { status: 500 },
    );
  const { error } = await supabase
    .from("ngo_verification_documents")
    .delete()
    .eq("id", document.id);
  return error
    ? NextResponse.json(
        { error: "Document record deletion failed." },
        { status: 500 },
      )
    : NextResponse.json({ success: true });
}
