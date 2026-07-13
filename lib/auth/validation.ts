import type { AccountType } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_COMPLEXITY_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
const SELF_SERVICE_ACCOUNT_TYPES: readonly AccountType[] = [
  "supporter",
  "ngo",
  "corporate",
];

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validatePassword(value: string): string | null {
  if (value.length < 12) {
    return "Password must be at least 12 characters.";
  }

  if (value.length > 72) {
    return "Password must be 72 characters or fewer.";
  }

  if (!PASSWORD_COMPLEXITY_PATTERN.test(value)) {
    return "Password must include uppercase, lowercase, number, and special character.";
  }

  return null;
}

type SignUpInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  accountType: string;
};

type ValidSignUpInput = {
  name: string;
  email: string;
  password: string;
  accountType: AccountType;
};

type ValidationResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      fieldErrors: Partial<Record<keyof SignUpInput, string>>;
    };

export function validateSignUpInput(
  input: SignUpInput,
): ValidationResult<ValidSignUpInput> {
  const fieldErrors: Partial<Record<keyof SignUpInput, string>> = {};
  const name = input.name.trim().replace(/\s+/g, " ");
  const email = normalizeEmail(input.email);

  if (name.length < 2 || name.length > 100) {
    fieldErrors.name = "Enter your full name.";
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  const passwordError = validatePassword(input.password);
  if (passwordError) {
    fieldErrors.password = passwordError;
  }

  if (input.password !== input.confirmPassword) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  if (!SELF_SERVICE_ACCOUNT_TYPES.includes(input.accountType as AccountType)) {
    fieldErrors.accountType = "Choose a valid account type.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  return {
    success: true,
    data: {
      name,
      email,
      password: input.password,
      accountType: input.accountType as AccountType,
    },
  };
}

export function validateEmail(value: string): string | null {
  const email = normalizeEmail(value);
  return email.length <= 254 && EMAIL_PATTERN.test(email)
    ? null
    : "Enter a valid email address.";
}
