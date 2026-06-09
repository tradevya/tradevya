import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { CategoryBadge, StatusBadge } from "@/components/status-badge";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";
import { getAuthenticatedContext } from "@/lib/data";

export const dynamic = "force-dynamic";

type RequestedPost = {
  id: string;
  category: string;
  shift_date: string;
  day_of_week: string;
  shift_start: string;
  shift_end: string;
  location_team: string | null;
  status: string;
};

type ShiftRequestRow = {
  id: string;
  status: string;
  request_type: string;
  message: string | null;
  created_at: string;
  shift_posts: RequestedPost | RequestedPost[] | null;
};

export default async function MyRequestsPage() {
  const { supabase, user, profile } = await getAuthenticatedContext();
  const [requestsResult, unreadResult] = await Promise.all([
    supabase
      .from("shift_requests")
      .select("id,status,request_type,message,created_at,shift_posts(id,category,shift_date,day_of_week,shift_start,shift_end,location_team,status)")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);

  const requests = (requestsResult.data ?? []) as ShiftRequestRow[];

  return (
    <AppShell profile={profile} unreadCount={unreadResult.count ?? 0}>
      <PageHeader eyebrow="My Requests" title="Shift requests" body="Follow the requests you submitted to coworkers in your station." />
      <section className="grid gap-3">
        {requests.length ? (
          requests.map((request) => {
            const post = Array.isArray(request.shift_posts) ? request.shift_posts[0] : request.shift_posts;
            return (
              <Link className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-teal-300" href={`/posts/${post?.id}`} key={request.id}>
                <div className="flex flex-wrap gap-2">
                  {post?.category ? <CategoryBadge value={post.category} /> : null}
                  <StatusBadge value={request.status} />
                </div>
                <h2 className="mt-4 text-lg font-bold text-zinc-950">{post?.day_of_week ?? "Shift request"}</h2>
                <p className="mt-2 text-sm text-zinc-600">
                  {formatDate(post?.shift_date)} / {formatTime(post?.shift_start)} - {formatTime(post?.shift_end)}
                </p>
                <p className="mt-2 text-xs font-medium text-zinc-500">Requested {formatDateTime(request.created_at)}</p>
              </Link>
            );
          })
        ) : (
          <EmptyState title="No requests yet" body="When you ask to take or trade a shift, it will show here." actionHref="/posts" actionLabel="Browse posts" />
        )}
      </section>
    </AppShell>
  );
}
