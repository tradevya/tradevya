import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import { respondToShiftRequestAction } from "@/app/actions/marketplace";
import { AppShell } from "@/components/app-shell";
import { CategoryBadge, StatusBadge } from "@/components/status-badge";
import { ShiftRequestForm } from "@/components/shift-request-form";
import { formatDate, formatDateTime, formatTime, statusLabel } from "@/lib/format";
import { getAuthenticatedContext } from "@/lib/data";

export const dynamic = "force-dynamic";

type RelatedProfile = {
  full_name: string | null;
  email: string | null;
};

type RelatedRequest = {
  id: string;
  requester_id: string;
  request_type: string;
  proposed_shift_date: string | null;
  proposed_start_time: string | null;
  proposed_end_time: string | null;
  message: string | null;
  status: string;
  created_at: string;
  profiles: RelatedProfile | null;
};

type ShiftPostDetail = {
  id: string;
  user_id: string | null;
  category: string;
  shift_date: string;
  day_of_week: string;
  shift_start: string;
  shift_end: string;
  location_team: string | null;
  notes: string | null;
  poster_name_snapshot: string | null;
  status: string;
  created_at: string;
};

export default async function ShiftPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, profile } = await getAuthenticatedContext();
  const [postResult, unreadResult] = await Promise.all([
    supabase
      .from("shift_posts")
      .select("id,user_id,category,shift_date,day_of_week,shift_start,shift_end,location_team,notes,poster_name_snapshot,status,created_at")
      .eq("id", id)
      .single(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);

  const post = postResult.data as ShiftPostDetail | null;
  const isOwner = post?.user_id === user.id;
  const [posterProfileResult, requestsResult] = post
    ? await Promise.all([
        post.user_id
          ? supabase.from("profiles").select("full_name,email").eq("id", post.user_id).maybeSingle()
          : Promise.resolve({ data: null }),
        isOwner
          ? supabase
              .from("shift_requests")
              .select("id,requester_id,request_type,proposed_shift_date,proposed_start_time,proposed_end_time,message,status,created_at")
              .eq("shift_post_id", post.id)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
      ])
    : [{ data: null }, { data: [] }];
  const requestRows = (requestsResult.data ?? []) as Omit<RelatedRequest, "profiles">[];
  const requesterIds = [...new Set(requestRows.map((request) => request.requester_id))];
  const requesterProfilesResult = requesterIds.length
    ? await supabase.from("profiles").select("id,full_name,email").in("id", requesterIds)
    : { data: [] };
  const requesterProfiles = new Map(
    (requesterProfilesResult.data ?? []).map((requester) => [
      requester.id,
      { full_name: requester.full_name, email: requester.email } satisfies RelatedProfile,
    ]),
  );
  const requests = requestRows.map((request) => ({
    ...request,
    profiles: requesterProfiles.get(request.requester_id) ?? null,
  }));
  const posterProfile = posterProfileResult.data as RelatedProfile | null;

  return (
    <AppShell profile={profile} unreadCount={unreadResult.count ?? 0}>
      <Link className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-teal-700" href="/posts">
        <ArrowLeft aria-hidden="true" size={16} />
        Back to All Posts
      </Link>

      {!post ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-zinc-950">Post not found</h1>
          <p className="mt-2 text-sm text-zinc-600">This post may be outside your station or no longer available.</p>
        </section>
      ) : (
        <div className="grid gap-5">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <CategoryBadge value={post.category} />
              <StatusBadge value={post.status} />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-zinc-950">{post.day_of_week} shift</h1>
            <p className="mt-2 text-sm text-zinc-500">Posted by {post.poster_name_snapshot || posterProfile?.full_name || "Tradevya member"} on {formatDateTime(post.created_at)}</p>
            <div className="mt-5 grid gap-3 text-sm text-zinc-700 md:grid-cols-3">
              <span className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" size={18} />
                {formatDate(post.shift_date)}
              </span>
              <span className="flex items-center gap-2">
                <Clock aria-hidden="true" size={18} />
                {formatTime(post.shift_start)} - {formatTime(post.shift_end)}
              </span>
              <span className="flex items-center gap-2">
                <MapPin aria-hidden="true" size={18} />
                {post.location_team || "Station area"}
              </span>
            </div>
            {post.notes ? <p className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">{post.notes}</p> : null}
          </section>

          {!isOwner && post.status !== "approved" && post.status !== "closed" ? (
            <section>
              <h2 className="mb-3 text-lg font-bold text-zinc-950">Submit a request</h2>
              <ShiftRequestForm isDayTrade={post.category === "day_trade"} postId={post.id} />
            </section>
          ) : null}

          {isOwner ? (
            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-950">Requests</h2>
              <div className="mt-4 grid gap-3">
                {requests.length ? (
                  requests.map((request) => (
                    <article className="rounded-lg border border-zinc-200 bg-zinc-50 p-4" key={request.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-zinc-950">{request.profiles?.full_name || "Station coworker"}</p>
                          <p className="text-xs text-zinc-500">{formatDateTime(request.created_at)} / {statusLabel(request.status)}</p>
                        </div>
                        {request.status === "pending" ? (
                          <div className="flex gap-2">
                            <form action={respondToShiftRequestAction}>
                              <input name="shift_request_id" type="hidden" value={request.id} />
                              <input name="response" type="hidden" value="approved" />
                              <button className="rounded-md bg-teal-700 px-3 py-2 text-sm font-bold text-white hover:bg-teal-800" type="submit">
                                Approve
                              </button>
                            </form>
                            <form action={respondToShiftRequestAction}>
                              <input name="shift_request_id" type="hidden" value={request.id} />
                              <input name="response" type="hidden" value="declined" />
                              <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold text-zinc-700 hover:bg-white" type="submit">
                                Decline
                              </button>
                            </form>
                          </div>
                        ) : null}
                      </div>
                      {request.message ? <p className="mt-3 text-sm leading-6 text-zinc-700">{request.message}</p> : null}
                      {request.request_type === "trade_proposal" ? (
                        <p className="mt-3 text-sm text-zinc-600">
                          Proposed trade: {formatDate(request.proposed_shift_date)} / {formatTime(request.proposed_start_time)} - {formatTime(request.proposed_end_time)}
                        </p>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">No requests yet.</p>
                )}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
