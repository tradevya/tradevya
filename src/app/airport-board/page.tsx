import { PhaseCard } from "@/components/phase-card";

export const dynamic = "force-dynamic";

export default function AirportBoardPage() {
  return (
    <PhaseCard
      body="Airport Board is scaffolded in the database and ready for Phase 2 UI work."
      bullets={[
        "Station-only and airport-wide visibility scopes",
        "Official announcements, operations, safety, lost and found, buy and sell, and general post types",
        "Comments, reactions, attachment placeholder, reporting, and admin moderation",
      ]}
      eyebrow="Airport Board"
      title="Airport-wide communications"
    />
  );
}
