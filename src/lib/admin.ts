export const BACKEND_OWNER_EMAILS = ["patricio.gerardo@delta.com"] as const;

export function isBackendOwnerEmail(email: string | null | undefined) {
  return Boolean(email && BACKEND_OWNER_EMAILS.includes(email.toLowerCase() as (typeof BACKEND_OWNER_EMAILS)[number]));
}
