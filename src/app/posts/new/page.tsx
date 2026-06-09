import { AppPage } from "@/components/app-page";
import { PageHeader } from "@/components/page-header";
import { ShiftPostForm } from "@/components/shift-post-form";

export const dynamic = "force-dynamic";

export default function CreateShiftPostPage() {
  return (
    <AppPage>
      <PageHeader
        eyebrow="Create shift post"
        title="Post a shift"
        body="Add the shift details station coworkers need before they request pickup, giveaway, trade, or double coverage."
      />
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <ShiftPostForm />
      </section>
    </AppPage>
  );
}
