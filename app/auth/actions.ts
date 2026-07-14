"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getUserRole } from "@/lib/auth/profile";
import {
  getPostAuthDestination,
  getSafeRedirectPath,
} from "@/lib/auth/redirects";
import type { AuthActionState } from "@/lib/auth/types";
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateSignUpInput,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function getApplicationOrigin(): Promise<string> {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (configuredUrl) {
    return configuredUrl;
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    const parsed = new URL(origin);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.origin;
    }
  }

  return "http://localhost:3000";
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail(readString(formData, "email"));
  const password = readString(formData, "password");
  const next = getSafeRedirectPath(readString(formData, "next"), "");
  const fieldErrors: AuthActionState["fieldErrors"] = {};

  const emailError = validateEmail(email);
  if (emailError) fieldErrors.email = emailError;
  if (!password) fieldErrors.password = "Enter your password.";

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    const message = error?.message.toLowerCase().includes("email not confirmed")
      ? "Confirm your email address before signing in."
      : "The email or password is incorrect.";

    return { status: "error", message };
  }

  const role = await getUserRole(supabase, data.user.id);
  if (!role) {
    await supabase.auth.signOut({ scope: "global" });
    return {
      status: "error",
      message: "Your account setup is incomplete. Please contact support.",
    };
  }

  redirect(next || getPostAuthDestination(role));
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = validateSignUpInput({
    name: readString(formData, "name"),
    email: readString(formData, "email"),
    password: readString(formData, "password"),
    confirmPassword: readString(formData, "confirmPassword"),
    accountType: readString(formData, "accountType"),
  });

  if (!result.success) {
    return { status: "error", fieldErrors: result.fieldErrors };
  }

  if (readString(formData, "terms") !== "accepted") {
    return {
      status: "error",
      message: "Accept the Terms and Privacy Policy to create an account.",
    };
  }

  const supabase = await createClient();
  const origin = await getApplicationOrigin();
  const destination = getPostAuthDestination(result.data.accountType);
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", destination);

  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      data: {
        name: result.data.name,
        account_type: result.data.accountType,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message:
        error.status === 429
          ? "Too many attempts. Please wait a few minutes and try again."
          : "We could not create your account. Please try again.",
    };
  }

  if (!data.session || !data.user) {
    redirect("/check-email?type=signup");
  }

  const role = await getUserRole(supabase, data.user.id);
  if (!role) {
    await supabase.auth.signOut({ scope: "global" });
    return {
      status: "error",
      message: "Your profile could not be created. Please try again shortly.",
    };
  }

  redirect(getPostAuthDestination(role));
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail(readString(formData, "email"));
  const emailError = validateEmail(email);

  if (emailError) {
    return {
      status: "error",
      fieldErrors: { email: emailError },
    };
  }

  const supabase = await createClient();
  const origin = await getApplicationOrigin();
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", "/reset-password");

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl.toString(),
  });

  // Always return the same result to avoid revealing registered addresses.
  redirect("/check-email?type=recovery");
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = readString(formData, "password");
  const confirmPassword = readString(formData, "confirmPassword");
  const fieldErrors: AuthActionState["fieldErrors"] = {};
  const passwordError = validatePassword(password);

  if (passwordError) fieldErrors.password = passwordError;
  if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "This recovery link has expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      status: "error",
      message:
        "Your password could not be updated. Request a new recovery link.",
    };
  }

  await supabase.auth.signOut({ scope: "global" });
  redirect("/sign-in?message=password-updated");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/sign-in?message=signed-out");
}

export async function revokeAllSessionsAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/dashboard/security");
  }

  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    throw new Error("Your sessions could not be revoked safely");
  }

  redirect("/sign-in?message=sessions-revoked");
}
