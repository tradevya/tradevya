import { PhaseCard } from "@/components/phase-card";

export const dynamic = "force-dynamic";

export default function AirportBoardPostDetailPage() {
  return (
    <PhaseCard
      body="The detail route is reserved for comments, reactions, reports, and moderation workflows."
      bullets={[
        "Read visibility is enforced by airport or station scope",
        "Regular users cannot approve official announcements",
        "Admins can moderate content according to their station or airport role",
      ]}
      eyebrow="Board detail"
      title="Airport Board post"
    />
  );
}
