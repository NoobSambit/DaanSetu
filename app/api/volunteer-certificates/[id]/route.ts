import { NextResponse } from "next/server";
import { z } from "zod";

import { createVolunteerCertificatePdf } from "@/lib/documents/volunteer-certificate";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = z
    .string()
    .uuid()
    .safeParse((await context.params).id);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid certificate" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { data: certificate } = await supabase
    .from("volunteer_certificates")
    .select(
      "id, user_id, ngo_id, certificate_number, hours_completed, issue_date, volunteer:users!volunteer_certificates_user_id_fkey(name), ngo:ngos(name, user_id), opportunity:volunteer_opportunities(title)",
    )
    .eq("id", parsed.data)
    .maybeSingle();
  if (!certificate) {
    return NextResponse.json(
      { error: "Certificate not found" },
      { status: 404 },
    );
  }

  const { data: account } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const ngo = certificate.ngo as unknown as { name: string; user_id: string };
  const isAuthorized =
    certificate.user_id === user.id ||
    ngo.user_id === user.id ||
    account?.role === "admin";
  if (!isAuthorized) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const volunteer = certificate.volunteer as unknown as { name: string };
  const opportunity = certificate.opportunity as unknown as { title: string };
  const pdf = createVolunteerCertificatePdf({
    certificateNumber: certificate.certificate_number,
    volunteerName: volunteer.name,
    ngoName: ngo.name,
    opportunityTitle: opportunity.title,
    hoursCompleted: Number(certificate.hours_completed),
    issueDate: certificate.issue_date,
  });

  return new NextResponse(pdf, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${certificate.certificate_number}.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
