import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | DaanSetu",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 sm:p-10">
        <Link href="/" className="text-sm font-semibold text-blue-700">
          DaanSetu
        </Link>
        <h1 className="mt-5 text-3xl font-bold text-slate-950">Terms of Use</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated June 8, 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <p>
            Use DaanSetu lawfully and provide accurate account and organization
            information. You are responsible for activity performed through your
            account.
          </p>
          <p>
            NGO and corporate accounts may be asked to provide verification
            before receiving elevated visibility or operating fundraising and
            CSR features.
          </p>
          <p>
            Do not misuse the platform, impersonate another person or
            organization, publish unlawful content, or attempt to bypass
            security and authorization controls.
          </p>
          <p>
            These terms are a concise project policy and should be reviewed by
            qualified legal counsel before a public production launch.
          </p>
        </div>
      </article>
    </main>
  );
}
