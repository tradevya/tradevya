import { Ban, CheckCircle2, RotateCcw, Trash2, UserCheck, XCircle } from "lucide-react";
import { blockUserAction, deleteShiftPostAction, deleteUserAction, setUserRoleAction, unblockUserAction, verifyUserAction } from "@/app/actions/admin-users";
import { approveAirportRequestAction, rejectAirportRequestAction } from "@/app/actions/airport-requests";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { isBackendOwnerEmail } from "@/lib/admin";
import { getAuthenticatedContext } from "@/lib/data";
import { categoryLabel, formatDate, formatDateTime, formatTime } from "@/lib/format";

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

type AdminProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  email_verified_at: string | null;
  created_at: string;
  company_name: string | null;
  airport_code: string | null;
  station_name: string | null;
  blocked_at: string | null;
  blocked_reason: string | null;
};

type AdminShiftPostRow = {
  id: string;
  category: string;
  shift_date: string;
  day_of_week: string;
  shift_start: string;
  shift_end: string;
  location_team: string | null;
  status: string;
  created_at: string;
  poster_email: string | null;
  poster_name: string | null;
  airport_code: string | null;
  station_name: string | null;
};

export default async function AdminModerationPage() {
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
        <PageHeader
          eyebrow="Admin"
          title="Backend moderation"
          body="Only the backend owner account can use this page."
        />
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-600">Your account does not have backend access.</p>
        </section>
      </AppShell>
    );
  }

  const [airportRequestsResult, profilesResult, shiftPostsResult] = await Promise.all([
    supabase
      .from("airport_requests")
      .select("id,requester_email,iata_code,name,city,state,notes,status,admin_note,created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.rpc("admin_list_profiles"),
    supabase.rpc("admin_list_shift_posts"),
  ]);

  const data = airportRequestsResult.data;
  const requests = (data ?? []) as AirportRequest[];
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const reviewedRequests = requests.filter((request) => request.status !== "pending");
  const users = (profilesResult.data ?? []) as AdminProfileRow[];
  const shiftPosts = (shiftPostsResult.data ?? []) as AdminShiftPostRow[];

  return (
    <AppShell profile={profile} unreadCount={count ?? 0}>
      <PageHeader
        eyebrow="Admin"
        title="Backend moderation"
        body="Review requested airports and manage user access."
      />

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-teal-700">Users</p>
            <h2 className="text-xl font-bold text-zinc-950">User management</h2>
          </div>
          <p className="text-xs font-semibold text-zinc-500">{users.length} users shown</p>
        </div>

        {profilesResult.error ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{profilesResult.error.message}</p>
        ) : null}

        <div className="mt-4 grid gap-3">
          {users.length ? (
            users.map((managedUser) => {
              const isSelf = managedUser.id === user.id;

              return (
                <article className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4" key={managedUser.id}>
                  <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-zinc-950">{managedUser.full_name || "Unnamed user"}</h3>
                      <p className="truncate text-sm font-semibold text-zinc-600">{managedUser.email}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {managedUser.company_name || "Company pending"} / {managedUser.airport_code || "Airport pending"} / {managedUser.station_name || "Station pending"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">Joined {formatDateTime(managedUser.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-bold text-zinc-700">{managedUser.role.replaceAll("_", " ")}</span>
                      <span className={`rounded-md border px-2 py-1 text-xs font-bold ${managedUser.email_verified_at ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                        {managedUser.email_verified_at ? "Verified" : "Unverified"}
                      </span>
                      <span className={`rounded-md border px-2 py-1 text-xs font-bold ${managedUser.blocked_at ? "border-rose-200 bg-rose-50 text-rose-800" : "border-zinc-200 bg-white text-zinc-700"}`}>
                        {managedUser.blocked_at ? "Blocked" : "Active"}
                      </span>
                    </div>
                  </div>
                  {managedUser.blocked_reason ? <p className="rounded-md border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-800">Block reason: {managedUser.blocked_reason}</p> : null}

                  <div className="grid gap-3 xl:grid-cols-2">
                    <form action={setUserRoleAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <input name="user_id" type="hidden" value={managedUser.id} />
                      <label className="grid gap-1 text-xs font-bold text-zinc-700">
                        Role
                        <select className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" defaultValue={managedUser.role} disabled={isSelf} name="role">
                          <option value="regular_user">Regular user</option>
                          <option value="station_admin">Station admin</option>
                          <option value="airport_admin">Airport admin</option>
                        </select>
                      </label>
                      <button className="min-h-10 rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-300" disabled={isSelf} type="submit">
                        Save role
                      </button>
                    </form>

                    {managedUser.blocked_at ? (
                      <form action={unblockUserAction}>
                        <input name="user_id" type="hidden" value={managedUser.id} />
                        <button className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400" disabled={isSelf} type="submit">
                          <RotateCcw aria-hidden="true" size={16} />
                          Unblock user
                        </button>
                      </form>
                    ) : (
                      <form action={blockUserAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <input name="user_id" type="hidden" value={managedUser.id} />
                        <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-rose-600" disabled={isSelf} name="reason" placeholder="Block reason" />
                        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400" disabled={isSelf} type="submit">
                          <Ban aria-hidden="true" size={16} />
                          Block
                        </button>
                      </form>
                    )}

                    <form action={verifyUserAction}>
                      <input name="user_id" type="hidden" value={managedUser.id} />
                      <button className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400" disabled={Boolean(managedUser.email_verified_at)} type="submit">
                        <UserCheck aria-hidden="true" size={16} />
                        Verify
                      </button>
                    </form>

                    <form action={deleteUserAction} className="grid gap-2 sm:grid-cols-[120px_auto]">
                      <input name="user_id" type="hidden" value={managedUser.id} />
                      <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-rose-600" disabled={isSelf} name="confirm" placeholder="DELETE" />
                      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-zinc-300" disabled={isSelf} type="submit">
                        <Trash2 aria-hidden="true" size={16} />
                        Delete
                      </button>
                    </form>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState title="No users found" body="New verified accounts will appear here." />
          )}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-teal-700">Posts</p>
            <h2 className="text-xl font-bold text-zinc-950">Post moderation</h2>
          </div>
          <p className="text-xs font-semibold text-zinc-500">{shiftPosts.length} recent posts shown</p>
        </div>

        {shiftPostsResult.error ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{shiftPostsResult.error.message}</p>
        ) : null}

        <div className="mt-4 grid gap-3">
          {shiftPosts.length ? (
            shiftPosts.map((post) => (
              <article className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4" key={post.id}>
                <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-zinc-950">{categoryLabel(post.category)}</h3>
                    <p className="mt-1 text-sm font-semibold text-zinc-700">
                      {formatDate(post.shift_date)} {post.day_of_week} / {formatTime(post.shift_start)} to {formatTime(post.shift_end)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {post.airport_code || "Airport pending"} / {post.station_name || "Station pending"} / Location: {post.location_team || "Station area"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">Posted by {post.poster_name || post.poster_email || "Tradevya member"} on {formatDateTime(post.created_at)}</p>
                  </div>
                  <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-bold text-zinc-700 lg:justify-self-end">{post.status}</span>
                </div>

                <form action={deleteShiftPostAction} className="grid gap-2 sm:grid-cols-[120px_auto]">
                  <input name="post_id" type="hidden" value={post.id} />
                  <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-rose-600" name="confirm" placeholder="DELETE" />
                  <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800" type="submit">
                    <Trash2 aria-hidden="true" size={16} />
                    Delete post
                  </button>
                </form>
              </article>
            ))
          ) : (
            <EmptyState title="No posts found" body="Recent station shift posts will appear here." />
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-teal-700">Airports</p>
          <h2 className="text-xl font-bold text-zinc-950">Airport requests</h2>
        </div>
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
