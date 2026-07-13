import type { NextRequest } from "next/server";

export function hasValidRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const requestOrigin = new URL(request.url).origin;
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
      : requestOrigin;

    return origin === requestOrigin || origin === configuredOrigin;
  } catch {
    return false;
  }
}
