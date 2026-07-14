import { createHash } from "node:crypto";
import { redirect } from "next/navigation";

import { acceptCorporateInvitationFormAction } from "@/app/corporate/invitations/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function CorporateInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    redirect(
      `/sign-in?next=/corporate/invitations/${encodeURIComponent(token)}`,
    );

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data: invitation } = await admin
    .from("corporate_invitations")
    .select("id, corporate_id, email, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  const unavailable =
    !invitation ||
    invitation.status === "revoked" ||
    invitation.status === "expired" ||
    // Server-rendered expiry must be evaluated against the request time.
    // eslint-disable-next-line react-hooks/purity
    new Date(invitation.expires_at).getTime() <= Date.now();
  const wrongAccount =
    invitation && invitation.email.toLowerCase() !== user.email?.toLowerCase();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-3xl font-bold text-[#10214e]">
          Corporate employee invitation
        </h1>
        {unavailable ? (
          <p className="mt-5 text-red-700">
            This invitation has expired or was revoked.
          </p>
        ) : wrongAccount ? (
          <p className="mt-5 text-amber-800">
            Sign in with the invited email address to accept this invitation.
          </p>
        ) : (
          <>
            <p className="mt-5 text-slate-700">
              This invitation is valid and ready to accept for your verified
              account.
            </p>
            <form action={acceptCorporateInvitationFormAction} className="mt-6">
              <input name="token" type="hidden" value={token} />
              <button className="btn btn-primary" type="submit">
                Accept invitation
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
