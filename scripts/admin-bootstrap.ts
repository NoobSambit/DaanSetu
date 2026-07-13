import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

if (!url || !serviceRoleKey || !adminEmail) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and ADMIN_EMAIL are required.",
  );
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: authUsers, error: authError } =
  await supabase.auth.admin.listUsers();

if (authError) {
  throw new Error(`Unable to read Supabase Auth users: ${authError.message}`);
}

const authUser = authUsers.users.find(
  (candidate) => candidate.email?.toLowerCase() === adminEmail,
);

if (!authUser) {
  throw new Error(
    `No verified Supabase Auth account exists for ${adminEmail}.`,
  );
}

if (!authUser.email_confirmed_at) {
  throw new Error("The admin account must verify its email before promotion.");
}

const { error: updateError } = await supabase
  .from("users")
  .update({ role: "admin", updated_at: new Date().toISOString() })
  .eq("id", authUser.id);

if (updateError) {
  throw new Error(
    `Unable to promote the admin account: ${updateError.message}`,
  );
}

await supabase.auth.admin.signOut(authUser.id, "global");
process.stdout.write(
  `Promoted ${adminEmail} and revoked its existing sessions.\n`,
);
