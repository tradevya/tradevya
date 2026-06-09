import { PhaseCard } from "@/components/phase-card";

export const dynamic = "force-dynamic";

export default function CreateTeamPostPage() {
  return (
    <PhaseCard
      body="This route will become the team post creation form."
      bullets={[
        "Operational update categories can be added without changing the existing station model",
        "Critical team updates can later request promotion",
        "Attachment placeholders are in the database but no cloud storage is connected",
      ]}
      eyebrow="Create team post"
      title="Create team update"
    />
  );
}
