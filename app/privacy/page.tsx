import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/PagePrimitives";

export const metadata: Metadata = {
  title: "Privacy Policy | DaanSetu",
};

export default function PrivacyPage() {
  return (
    <main className="page-frame">
      <section className="page-content max-w-3xl">
        <PageHeader
          eyebrow="Trust and safety"
          title="Privacy policy"
          description="Last updated June 8, 2026"
        />
        <article className="panel p-6 sm:p-10">
          <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
            <p>
              DaanSetu stores the account information needed to provide the
              service, including your name, email address, account type, and
              activity you choose to perform.
            </p>
            <p>
              Passwords and authentication sessions are managed by Supabase
              Auth. DaanSetu does not store plaintext passwords.
            </p>
            <p>
              Public profile and organization information may be visible to
              other visitors. Authentication credentials and private session
              tokens are not public profile data.
            </p>
            <p>
              This policy is a concise project policy and should be reviewed by
              qualified legal counsel before a public production launch.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
