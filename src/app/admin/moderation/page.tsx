import Link from "next/link";
import { Building2, CheckCircle2, ClipboardList, Search, Users, XCircle } from "lucide-react";
import { approveAirportRequestAction, rejectAirportRequestAction } from "@/app/actions/airport-requests";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { isBackendOwnerEmail } from "@/lib/admin";
import { getAuthenticatedContext } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type BackendCounts = {
  companies_count: number;
  users_count: number;
  posts_count: number;
};

type AdminSearchProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  company_name: string | null;
  airport_code: string | null;
  station_name: string | null;
  blocked_at: string | null;
  disabled_at: string | null;
  post_count: number;
};

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

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const { supabase, user, profile } = await getAuthenticatedContext();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);
  const isBackendOwner = isBackendOwnerEmail(profile?.email);

  if (!isBackendOwner) {
    return (
      <AppShell profile={profile} unreadCount={count ?? 0}>
        <PageHeader eyebrow="Backend" title="Backend" body="Only the backend owner account can use this page." />
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-600">Your account does not have backend access.</p>
        </section>
      </AppShell>
    );
  }

  const [countsResult, usersResult, airportRequestsResult] = await Promise.all([
    supabase.rpc("admin_get_backend_counts"),
    supabase.rpc("admin_search_profiles", { search_text: query || null }),
    supabase
      .from("airport_requests")
      .select("id,requester_email,iata_code,name,city,state,notes,status,admin_note,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const counts = (countsResult.data?.[0] ?? { companies_count: 0, users_count: 0, posts_count: 0 }) as BackendCounts;
  const users = (usersResult.data ?? []) as AdminSearchProfile[];
  const requests = (airportRequestsResult.data ?? []) as AirportRequest[];
  const pendingRequests = requests.filter((request) => request.status === "pending");

  return (
    <AppShell profile={profile} unreadCount={count ?? 0}>
      <PageHeader eyebrow="Backend" title="Backend control" body="Search a user to manage their account, location, access, and posts." />

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "Companies", value: counts.companies_count, icon: Building2 },
          { label: "Users", value: counts.users_count, icon: Users },
          { label: "Posts", value: counts.posts_count, icon: ClipboardList },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm sm:p-4" key={metric.label}>
              <Icon aria-hidden="true" className="text-teal-700" size={20} />
              <p className="mt-3 text-2xl font-extrabold text-zinc-950 sm:text-3xl">{metric.value}</p>
              <p className="mt-1 truncate text-[11px] font-bold text-zinc-600 sm:text-sm">{metric.label}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-teal-700">Users</p>
            <h2 className="text-xl font-bold text-zinc-950">Search users</h2>
          </div>
          <p className="text-xs font-semibold text-zinc-500">{users.length} shown</p>
        </div>

        <form className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="sr-only" htmlFor="backend-user-search">Search users</label>
          <input
            className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
            defaultValue={query}
            id="backend-user-search"
            name="q"
            placeholder="Search by name, email, company, or airport"
          />
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800" type="submit">
            <Search aria-hidden="true" size={16} />
            Search
          </button>
        </form>

        <div className="mt-4 divide-y divide-zinc-200">
          {users.length ? (
            users.map((managedUser) => (
              <Link className="grid gap-2 py-4 hover:bg-zinc-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-2" href={`/admin/users/${managedUser.id}`} key={managedUser.id}>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-zinc-950">{managedUser.full_name || "Unnamed user"}</span>
                  <span className="block truncate text-sm text-zinc-600">{managedUser.email}</span>
                  <span className="block truncate text-xs text-zinc-500">
                    {managedUser.company_name || "Company pending"} / {managedUser.airport_code || "Airport pending"} / {managedUser.station_name || "Station pending"}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2 sm:justify-end">
                  <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-bold text-zinc-700">{managedUser.post_count} posts</span>
                  <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-bold text-zinc-700">{managedUser.role.replaceAll("_", " ")}</span>
                  {managedUser.blocked_at ? <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-800">Blocked</span> : null}
                  {managedUser.disabled_at ? <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">Disabled</span> : null}
                </span>
              </Link>
            ))
          ) : (
            <EmptyState title="No users found" body="Try a different name, email, company, or airport." />
          )}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-teal-700">Airports</p>
            <h2 className="text-xl font-bold text-zinc-950">Pending airport requests</h2>
          </div>
          <p className="text-xs font-semibold text-zinc-500">{pendingRequests.length} pending</p>
        </div>

        <div className="mt-4 grid gap-3">
          {pendingRequests.length ? (
            pendingRequests.map((request) => (
              <article className="grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4" key={request.id}>
                <div>
                  <h3 className="font-bold text-zinc-950">{request.iata_code} - {request.name}</h3>
                  <p className="text-sm text-zinc-600">
                    {request.city}, {request.state} / requested {formatDateTime(request.created_at)}
                  </p>
                  {request.requester_email ? <p className="text-xs text-zinc-500">Requester: {request.requester_email}</p> : null}
                </div>
                <div className="grid gap-2 lg:grid-cols-2">
                  <form action={approveAirportRequestAction} className="grid gap-2">
                    <input name="request_id" type="hidden" value={request.id} />
                    <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" name="admin_note" placeholder="Approval note" />
                    <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800" type="submit">
                      <CheckCircle2 aria-hidden="true" size={16} />
                      Approve
                    </button>
                  </form>
                  <form action={rejectAirportRequestAction} className="grid gap-2">
                    <input name="request_id" type="hidden" value={request.id} />
                    <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-rose-600" name="admin_note" placeholder="Rejection note" />
                    <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800" type="submit">
                      <XCircle aria-hidden="true" size={16} />
                      Reject
                    </button>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="No pending airport requests" body="New requested airports will appear here." />
          )}
        </div>
      </section>
    </AppShell>
  );
}
