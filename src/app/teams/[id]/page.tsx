import { PhaseCard } from "@/components/phase-card";

export const dynamic = "force-dynamic";

export default function TeamFeedPage() {
  return (
    <PhaseCard
      body="The team feed route is reserved for operational team posts."
      bullets={[
        "Canceled flights, gate changes, delays, diversions, and staffing needs",
        "Critical update flag for time-sensitive station information",
        "Comments and reactions scoped to team members",
      ]}
      eyebrow="Team feed"
      title="Team channel"
    />
  );
}
