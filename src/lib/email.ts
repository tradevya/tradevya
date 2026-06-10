import { OWNER_EMAIL_ALLOWLIST, PERSONAL_EMAIL_DOMAINS } from "@/lib/constants";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getEmailDomain(email: string) {
  const normalized = normalizeEmail(email);
  const [, domain = ""] = normalized.split("@");
  return domain;
}

export function isPersonalEmail(email: string) {
  const normalized = normalizeEmail(email);

  if (OWNER_EMAIL_ALLOWLIST.includes(normalized as (typeof OWNER_EMAIL_ALLOWLIST)[number])) {
    return false;
  }

  return PERSONAL_EMAIL_DOMAINS.includes(getEmailDomain(normalized) as (typeof PERSONAL_EMAIL_DOMAINS)[number]);
}

export function isValidWorkEmail(email: string) {
  const normalized = normalizeEmail(email);
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized) && !isPersonalEmail(normalized);
}
