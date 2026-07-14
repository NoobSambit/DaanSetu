import { NextResponse } from "next/server";

import { exportNGOReport } from "@/lib/services/analytics";
import { createClient } from "@/lib/supabase/server";

function csvCell(value: string | number | undefined): string {
  const text = String(value ?? "");
  const formulaSafe = /^[=+\-@]/.test(text) ? "'" + text : text;
  return '"' + formulaSafe.replaceAll('"', '""') + '"';
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email_confirmed_at) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { data: ngo, error: ngoError } = await supabase
    .from("ngos")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (ngoError || !ngo) {
    return NextResponse.json(
      { error: "NGO profile required" },
      { status: 403 },
    );
  }

  try {
    const rows = await exportNGOReport(ngo.id, supabase);
    const csvRows = [
      [
        "Type",
        "Title",
        "Goal or applications",
        "Raised",
        "Created",
        "Deadline",
      ].map(csvCell),
      ...rows.map((row) =>
        row.type === "Campaign"
          ? [
              row.type,
              row.title,
              row.goal,
              row.raised,
              row.created,
              row.deadline,
            ].map(csvCell)
          : [row.type, row.title, row.applications, "", row.created, ""].map(
              csvCell,
            ),
      ),
    ];
    const safeName =
      ngo.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "ngo";

    return new NextResponse(csvRows.map((row) => row.join(",")).join("\r\n"), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition":
          'attachment; filename="' + safeName + '_impact_report.csv"',
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Impact report could not be generated" },
      { status: 503 },
    );
  }
}
