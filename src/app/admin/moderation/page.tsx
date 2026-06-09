import { PhaseCard } from "@/components/phase-card";

export const dynamic = "force-dynamic";

export default function AdminModerationPage() {
  return (
    <PhaseCard
      body="Moderation tables and role fields are in place. Full admin workflows are queued for Phase 2."
      bullets={[
        "Station admins moderate station content",
        "Airport admins moderate airport-wide content and official announcements",
        "Regular users cannot moderate or approve official announcements",
      ]}
      eyebrow="Admin"
      title="Moderation"
    />
  );
}
