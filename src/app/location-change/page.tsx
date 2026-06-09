import { AppShell } from "@/components/app-shell";
import { LocationChangeForm } from "@/components/auth-forms";
import { PageHeader } from "@/components/page-header";
import { getAuthenticatedContext, getDirectoryData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LocationChangePage() {
  const [{ supabase, user, profile }, directory] = await Promise.all([getAuthenticatedContext(), getDirectoryData()]);
  const [{ count }, requestsResult] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
    supabase
      .from("location_change_requests")
      .select("id,status,reason,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <AppShell profile={profile} unreadCount={count ?? 0}>
      <PageHeader
        eyebrow="Location change"
        title="Request a new station or airport"
        body="Moving to a different location creates a review request instead of changing access instantly."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <LocationChangeForm airports={directory.airports} companies={directory.companies} stations={directory.stations} />
        </section>
        <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-zinc-950">Recent requests</h2>
          <div className="mt-4 grid gap-3">
            {requestsResult.data?.length ? (
              requestsResult.data.map((request) => (
                <div className="border-b border-zinc-200 pb-3 last:border-b-0 last:pb-0" key={request.id}>
                  <p className="text-sm font-bold text-zinc-900">{request.status}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-600">{request.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-600">No location change requests yet.</p>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
