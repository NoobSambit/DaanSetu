import { CheckCircle2, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import AuthShell from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Check your email | DaanSetu",
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const isRecovery = params.type === "recovery";

  return (
    <AuthShell
      title="Check your email"
      description={
        isRecovery
          ? "If an account exists for that address, a recovery link is on its way."
          : "Use the verification link we sent to activate your account."
      }
    >
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          {isRecovery ? (
            <Mail aria-hidden="true" />
          ) : (
            <CheckCircle2 aria-hidden="true" />
          )}
        </div>
        <p className="text-sm text-slate-600">
          The link may take a minute to arrive. Check your spam folder before
          requesting another one.
        </p>
        <Link
          href={isRecovery ? "/forgot-password" : "/sign-in"}
          className="mt-6 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          {isRecovery ? "Send another recovery link" : "Go to sign in"}
        </Link>
      </div>
    </AuthShell>
  );
}
