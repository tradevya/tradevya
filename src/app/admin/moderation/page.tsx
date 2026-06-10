import { CheckCircle2, XCircle } from "lucide-react";
import { approveAirportRequestAction, rejectAirportRequestAction } from "@/app/actions/airport-requests";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getAuthenticatedContext } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type AirportRequest = {
  id: string;
  requester_email: string | null;
  iata_code: string;
  name: string;
  city: string;
  state: string;
  notes: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

export default async function AdminModerationPage() {
  const { supabase, user, profile } = await getAuthenticatedContext();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);
  const isAdmin = profile?.role === "station_admin" || profile?.role === "airport_admin";

  if (!isAdmin) {
    return (
      <AppShell profile={profile} unreadCount={count ?? 0}>
        <PageHeader
          eyebrow="Admin"
          title="Backend moderation"
          body="Only station and airport admins can approve airport requests."
        />
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-600">Your account is not an admin account yet.</p>
        </section>
      </AppShell>
    );
  }

  const { data } = await supabase
    .from("airport_requests")
    .select("id,requester_email,iata_code,name,city,state,notes,status,admin_note,created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  const requests = (data ?? []) as AirportRequest[];
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const reviewedRequests = requests.filter((request) => request.status !== "pending");

  return (
    <AppShell profile={profile} unreadCount={count ?? 0}>
      <PageHeader
        eyebrow="Admin"
        title="Backend moderation"
        body="Review requested airports. Approving creates the airport and the default station departments."
      />

      <section className="grid gap-4">
        {pendingRequests.length ? (
          pendingRequests.map((request) => (
            <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" key={request.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-teal-700">Pending airport</p>
                  <h2 className="mt-1 text-xl font-bold text-zinc-950">
                    {request.iata_code} - {request.name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    {request.city}, {request.state} / requested {formatDateTime(request.created_at)}
                  </p>
                  {request.requester_email ? <p className="mt-1 text-sm text-zinc-500">Requester: {request.requester_email}</p> : null}
                  {request.notes ? <p className="mt-4 rounded-md bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">{request.notes}</p> : null}
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                <form action={approveAirportRequestAction} className="grid gap-3 rounded-lg border border-teal-200 bg-teal-50/70 p-4">
                  <input name="request_id" type="hidden" value={request.id} />
                  <div className="flex items-center gap-2 text-sm font-bold text-teal-900">
                    <CheckCircle2 aria-hidden size={18} />
                    Approve and add airport
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-xs font-bold text-zinc-700">
                      Latitude
                      <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" name="latitude" placeholder="Optional" type="number" step="0.000001" />
                    </label>
                    <label className="grid gap-2 text-xs font-bold text-zinc-700">
                      Longitude
                      <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" name="longitude" placeholder="Optional" type="number" step="0.000001" />
                    </label>
                  </div>
                  <label className="grid gap-2 text-xs font-bold text-zinc-700">
                    Admin note
                    <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" name="admin_note" placeholder="Optional" />
                  </label>
                  <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800" type="submit">
                    Approve
                  </button>
                </form>

                <form action={rejectAirportRequestAction} className="grid gap-3 rounded-lg border border-rose-200 bg-rose-50/70 p-4">
                  <input name="request_id" type="hidden" value={request.id} />
                  <div className="flex items-center gap-2 text-sm font-bold text-rose-900">
                    <XCircle aria-hidden size={18} />
                    Reject request
                  </div>
                  <label className="grid gap-2 text-xs font-bold text-zinc-700">
                    Admin note
                    <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-rose-600" name="admin_note" placeholder="Reason or duplicate note" />
                  </label>
                  <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800" type="submit">
                    Reject
                  </button>
                </form>
              </div>
            </article>
          ))
        ) : (
          <EmptyState title="No pending airport requests" body="New requests from signup and location pages will appear here." />
        )}
      </section>

      {reviewedRequests.length ? (
        <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950">Recent reviewed requests</h2>
          <div className="mt-4 grid gap-3">
            {reviewedRequests.map((request) => (
              <div className="border-b border-zinc-200 pb-3 last:border-b-0 last:pb-0" key={request.id}>
                <p className="text-sm font-bold text-zinc-900">
                  {request.iata_code} / {request.status}
                </p>
                <p className="mt-1 text-xs text-zinc-600">{request.admin_note || `${request.name}, ${request.city}`}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
