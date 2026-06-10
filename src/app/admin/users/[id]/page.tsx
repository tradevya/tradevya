import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, RotateCcw, Trash2, UserCheck } from "lucide-react";
import {
  blockUserAction,
  deleteShiftPostAction,
  deleteUserAction,
  disableUserAction,
  enableUserAction,
  unblockUserAction,
  updateUserDetailsAction,
  updateUserShiftPostAction,
  verifyUserAction,
} from "@/app/actions/admin-users";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SHIFT_CATEGORIES, SHIFT_STATUSES } from "@/lib/constants";
import { isBackendOwnerEmail } from "@/lib/admin";
import { getAuthenticatedContext, getDirectoryData } from "@/lib/data";
import { categoryLabel, formatDate, formatDateTime, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type AdminUserDetail = {
  id: string;
  email: string;
  full_name: string | null;
  contact_phone: string | null;
  role: string;
  email_verified_at: string | null;
  created_at: string;
  company_id: string | null;
  custom_company_name: string | null;
  airport_id: string | null;
  station_id: string | null;
  company_name: string | null;
  airport_code: string | null;
  station_name: string | null;
  blocked_at: string | null;
  blocked_reason: string | null;
  disabled_at: string | null;
  disabled_reason: string | null;
  post_count: number;
};

type AdminUserShiftPost = {
  id: string;
  category: string;
  shift_date: string;
  day_of_week: string;
  shift_start: string;
  shift_end: string;
  location_team: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  airport_code: string | null;
  station_name: string | null;
  request_count: number;
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, profile } = await getAuthenticatedContext();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (!isBackendOwnerEmail(profile?.email)) {
    return (
      <AppShell profile={profile} unreadCount={count ?? 0}>
        <PageHeader eyebrow="Backend" title="Backend" body="Only the backend owner account can use this page." />
      </AppShell>
    );
  }

  const [detailResult, postsResult, directory] = await Promise.all([
    supabase.rpc("admin_get_profile_detail", { target_user_id: id }),
    supabase.rpc("admin_list_user_shift_posts", { target_user_id: id }),
    getDirectoryData(),
  ]);

  const managedUser = detailResult.data?.[0] as AdminUserDetail | undefined;
  const posts = (postsResult.data ?? []) as AdminUserShiftPost[];

  if (!managedUser) {
    notFound();
  }

  const airportById = new Map(directory.airports.map((airport) => [airport.id, airport]));
  const isSelf = managedUser.id === user.id;

  return (
    <AppShell profile={profile} unreadCount={count ?? 0}>
      <Link className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-teal-700" href="/admin/moderation">
        <ArrowLeft aria-hidden="true" size={16} />
        Back to backend
      </Link>

      <PageHeader
        eyebrow="Backend user"
        title={managedUser.full_name || managedUser.email}
        body={`${managedUser.company_name || "Company pending"} / ${managedUser.airport_code || "Airport pending"} / ${managedUser.station_name || "Station pending"}`}
      />

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "Posts", value: managedUser.post_count },
          { label: "Verified", value: managedUser.email_verified_at ? "Yes" : "No" },
          { label: "Access", value: managedUser.blocked_at ? "Blocked" : managedUser.disabled_at ? "Disabled" : "Active" },
        ].map((metric) => (
          <div className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm sm:p-4" key={metric.label}>
            <p className="text-2xl font-extrabold text-zinc-950 sm:text-3xl">{metric.value}</p>
            <p className="mt-1 truncate text-[11px] font-bold text-zinc-600 sm:text-sm">{metric.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-950">User information</h2>
        <p className="mt-1 text-xs text-zinc-500">Joined {formatDateTime(managedUser.created_at)}</p>

        <form action={updateUserDetailsAction} className="mt-5 grid gap-4">
          <input name="user_id" type="hidden" value={managedUser.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-zinc-800">
              Full name
              <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" defaultValue={managedUser.full_name ?? ""} name="full_name" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-800">
              Email
              <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" defaultValue={managedUser.email} name="email" required type="email" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-800">
              Contact phone
              <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" defaultValue={managedUser.contact_phone ?? ""} name="contact_phone" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-800">
              Role
              <select className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" defaultValue={managedUser.role} disabled={isSelf} name="role" required>
                <option value="regular_user">Regular user</option>
                <option value="station_admin">Station admin</option>
                <option value="airport_admin">Airport admin</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-800">
              Company
              <select className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" defaultValue={managedUser.company_id ?? ""} name="company_id" required>
                {directory.companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-800">
              Custom company
              <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" defaultValue={managedUser.custom_company_name ?? ""} name="custom_company_name" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-800">
              Airport
              <select className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" defaultValue={managedUser.airport_id ?? ""} name="airport_id" required>
                {directory.airports.map((airport) => (
                  <option key={airport.id} value={airport.id}>
                    {airport.iata_code} - {airport.city}, {airport.state}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-800">
              Station
              <select className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" defaultValue={managedUser.station_id ?? ""} name="station_id" required>
                {directory.stations.map((station) => {
                  const airport = airportById.get(station.airport_id);
                  return (
                    <option key={station.id} value={station.id}>
                      {airport?.iata_code ?? "Airport"} / {station.name}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>
          <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-300" disabled={isSelf} type="submit">
            Save user
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-950">Access controls</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <form action={verifyUserAction}>
            <input name="user_id" type="hidden" value={managedUser.id} />
            <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400" disabled={Boolean(managedUser.email_verified_at)} type="submit">
              <UserCheck aria-hidden="true" size={16} />
              Verify email
            </button>
          </form>

          {managedUser.blocked_at ? (
            <form action={unblockUserAction}>
              <input name="user_id" type="hidden" value={managedUser.id} />
              <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400" disabled={isSelf} type="submit">
                <RotateCcw aria-hidden="true" size={16} />
                Unblock user
              </button>
            </form>
          ) : (
            <form action={blockUserAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input name="user_id" type="hidden" value={managedUser.id} />
              <input className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-rose-600" disabled={isSelf} name="reason" placeholder="Block reason" />
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400" disabled={isSelf} type="submit">
                <Ban aria-hidden="true" size={16} />
                Block
              </button>
            </form>
          )}

          {managedUser.disabled_at ? (
            <form action={enableUserAction}>
              <input name="user_id" type="hidden" value={managedUser.id} />
              <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400" disabled={isSelf} type="submit">
                <RotateCcw aria-hidden="true" size={16} />
                Enable user
              </button>
            </form>
          ) : (
            <form action={disableUserAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input name="user_id" type="hidden" value={managedUser.id} />
              <input className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-amber-600" disabled={isSelf} name="reason" placeholder="Disable reason" />
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-amber-500 px-4 text-sm font-bold text-zinc-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-300" disabled={isSelf} type="submit">
                Disable
              </button>
            </form>
          )}

          <form action={deleteUserAction} className="grid gap-2 sm:grid-cols-[120px_auto]">
            <input name="user_id" type="hidden" value={managedUser.id} />
            <input className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-rose-600" disabled={isSelf} name="confirm" placeholder="DELETE" />
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-zinc-300" disabled={isSelf} type="submit">
              <Trash2 aria-hidden="true" size={16} />
              Delete user
            </button>
          </form>
        </div>
        {managedUser.blocked_reason ? <p className="mt-3 rounded-md border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-800">Block reason: {managedUser.blocked_reason}</p> : null}
        {managedUser.disabled_reason ? <p className="mt-3 rounded-md border border-amber-100 bg-amber-50 p-3 text-xs font-semibold text-amber-800">Disable reason: {managedUser.disabled_reason}</p> : null}
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-teal-700">Posts</p>
            <h2 className="text-xl font-bold text-zinc-950">User posts</h2>
          </div>
          <p className="text-xs font-semibold text-zinc-500">{posts.length} posts shown</p>
        </div>

        <div className="mt-4 grid gap-4">
          {posts.length ? (
            posts.map((post) => (
              <article className="rounded-md border border-zinc-200 bg-zinc-50 p-4" key={post.id}>
                <div className="mb-3">
                  <h3 className="font-bold text-zinc-950">{categoryLabel(post.category)}</h3>
                  <p className="text-xs text-zinc-500">
                    {post.airport_code || "Airport"} / {post.station_name || "Station"} / {post.request_count} requests / posted {formatDateTime(post.created_at)}
                  </p>
                </div>
                <form action={updateUserShiftPostAction} className="grid gap-3">
                  <input name="post_id" type="hidden" value={post.id} />
                  <input name="user_id" type="hidden" value={managedUser.id} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1 text-xs font-bold text-zinc-700">
                      Category
                      <select className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" defaultValue={post.category} name="category">
                        {SHIFT_CATEGORIES.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-zinc-700">
                      Status
                      <select className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" defaultValue={post.status} name="status">
                        {SHIFT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="grid gap-1 text-xs font-bold text-zinc-700">
                      Date
                      <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" defaultValue={post.shift_date} name="shift_date" type="date" />
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-zinc-700">
                      Start
                      <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" defaultValue={post.shift_start.slice(0, 5)} name="shift_start" type="time" />
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-zinc-700">
                      End
                      <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" defaultValue={post.shift_end.slice(0, 5)} name="shift_end" type="time" />
                    </label>
                  </div>
                  <label className="grid gap-1 text-xs font-bold text-zinc-700">
                    Location
                    <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" defaultValue={post.location_team ?? ""} name="location_team" placeholder="Location" />
                  </label>
                  <label className="grid gap-1 text-xs font-bold text-zinc-700">
                    Notes
                    <textarea className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600" defaultValue={post.notes ?? ""} name="notes" />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-[auto_120px_auto]">
                    <button className="inline-flex min-h-10 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800" type="submit">
                      Save post
                    </button>
                    <input className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-rose-600" form={`delete-post-${post.id}`} name="confirm" placeholder="DELETE" />
                    <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800" form={`delete-post-${post.id}`} type="submit">
                      <Trash2 aria-hidden="true" size={16} />
                      Delete post
                    </button>
                  </div>
                </form>
                <form action={deleteShiftPostAction} id={`delete-post-${post.id}`}>
                  <input name="post_id" type="hidden" value={post.id} />
                  <input name="user_id" type="hidden" value={managedUser.id} />
                </form>
                <p className="mt-2 text-xs text-zinc-500">
                  Current shift: {formatDate(post.shift_date)} {post.day_of_week} / {formatTime(post.shift_start)} to {formatTime(post.shift_end)}
                </p>
              </article>
            ))
          ) : (
            <EmptyState title="No posts" body="This user has not created any posts yet." />
          )}
        </div>
      </section>
    </AppShell>
  );
}
