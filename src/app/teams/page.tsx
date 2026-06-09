import { PhaseCard } from "@/components/phase-card";

export const dynamic = "force-dynamic";

export default function TeamsPage() {
  return (
    <PhaseCard
      body="Teams are scaffolded for small station groups and critical updates."
      bullets={[
        "Team channel feed with posts, comments, reactions, and reports",
        "Small group membership inside a verified station",
        "Critical update option with future promotion to station feed or Airport Board",
      ]}
      eyebrow="Teams"
      title="Station teams"
    />
  );
}
