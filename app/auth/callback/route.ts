import { NextResponse, type NextRequest } from "next/server";

import { getUserRole } from "@/lib/auth/profile";
import {
  getPostAuthDestination,
  getSafeRedirectPath,
} from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next");
  const next = getSafeRedirectPath(requestedNext, "");

  if (!code) {
    return NextResponse.redirect(
      new URL("/sign-in?error=invalid-link", request.url),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL("/sign-in?error=invalid-link", request.url),
    );
  }

  const role = await getUserRole(supabase, data.user.id);
  if (!role) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/sign-in?error=profile-missing", request.url),
    );
  }

  return NextResponse.redirect(
    new URL(next || getPostAuthDestination(role), request.url),
  );
}
