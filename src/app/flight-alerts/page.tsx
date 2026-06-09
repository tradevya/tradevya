import { PhaseCard } from "@/components/phase-card";

export const dynamic = "force-dynamic";

export default function FlightAlertsPage() {
  return (
    <PhaseCard
      body="Flight Number Alerts are intentionally UI and database placeholders only. No paid or external flight API is connected."
      bullets={[
        "Flight number and optional date",
        "Triggers for ETA window, landed, at gate, delay change, or canceled",
        "Notify user only or optionally notify a team, with a dedupe placeholder",
      ]}
      eyebrow="Flight alerts"
      title="Flight alert placeholders"
    />
  );
}
