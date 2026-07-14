import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { isFollowing } from "@/lib/services/follows";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const values = z
      .object({
        targetId: z.string().uuid(),
        targetType: z.enum(["user", "ngo", "corporate"]),
      })
      .safeParse({
        targetId: searchParams.get("targetId"),
        targetType: searchParams.get("targetType"),
      });

    if (!values.success) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const following = await isFollowing(
      user.id,
      values.data.targetId,
      values.data.targetType,
      supabase,
    );

    return NextResponse.json({ isFollowing: following });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
