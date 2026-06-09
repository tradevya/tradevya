import { PhaseCard } from "@/components/phase-card";

export const dynamic = "force-dynamic";

export default function CreateAirportBoardPostPage() {
  return (
    <PhaseCard
      body="This page will become the create form for Airport Board posts in Phase 2."
      bullets={[
        "Station-only posts publish immediately",
        "Airport-wide official announcements support approval rules",
        "Attachment placeholders and reporting hooks are already represented in the schema",
      ]}
      eyebrow="Create board post"
      title="Create Airport Board post"
    />
  );
}
