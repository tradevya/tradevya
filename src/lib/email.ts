import { PERSONAL_EMAIL_DOMAINS } from "@/lib/constants";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getEmailDomain(email: string) {
  const normalized = normalizeEmail(email);
  const [, domain = ""] = normalized.split("@");
  return domain;
}

export function isPersonalEmail(email: string) {
  return PERSONAL_EMAIL_DOMAINS.includes(getEmailDomain(email) as (typeof PERSONAL_EMAIL_DOMAINS)[number]);
}

export function isValidWorkEmail(email: string) {
  const normalized = normalizeEmail(email);
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized) && !isPersonalEmail(normalized);
}
