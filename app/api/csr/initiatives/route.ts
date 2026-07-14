import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const campaignId = z
    .string()
    .uuid()
    .safeParse(request.nextUrl.searchParams.get("campaignId"));
  if (!campaignId.success) {
    return NextResponse.json({ initiatives: [] });
  }
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ initiatives: [] });
  }

  const admin = createAdminClient();
  const { data: employee } = await admin
    .from("corporate_employees")
    .select("id, corporate_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!employee) return NextResponse.json({ initiatives: [] });

  const now = new Date().toISOString();
  const { data } = await admin
    .from("csr_initiatives")
    .select("id, title, match_percent")
    .eq("corporate_id", employee.corporate_id)
    .eq("status", "active")
    .lte("starts_at", now)
    .gte("ends_at", now)
    .or(`campaign_id.is.null,campaign_id.eq.${campaignId.data}`)
    .order("match_percent", { ascending: false });

  return NextResponse.json({ initiatives: data ?? [] });
}
