import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/PagePrimitives";

export const metadata: Metadata = {
  title: "Terms of Use | DaanSetu",
};

export default function TermsPage() {
  return (
    <main className="page-frame">
      <section className="page-content max-w-3xl">
        <PageHeader
          eyebrow="Trust and safety"
          title="Terms of use"
          description="Last updated June 8, 2026"
        />
        <article className="panel p-6 sm:p-10">
          <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
            <p>
              Use DaanSetu lawfully and provide accurate account and
              organization information. You are responsible for activity
              performed through your account.
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
      </section>
    </main>
  );
}
