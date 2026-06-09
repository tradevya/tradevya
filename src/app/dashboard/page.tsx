import Link from "next/link";
import { Bell, ClipboardList, Plus, Repeat2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ShiftPostCard, type ShiftPostSummary } from "@/components/shift-post-card";
import { EmptyState } from "@/components/empty-state";
import { getAuthenticatedContext } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, user, profile } = await getAuthenticatedContext();
  const [unreadResult, openPostsResult, myRequestsResult, recentPostsResult] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
    supabase.from("shift_posts").select("id", { count: "exact", head: true }).eq("station_id", profile?.station_id).eq("status", "open"),
    supabase.from("shift_requests").select("id", { count: "exact", head: true }).eq("requester_id", user.id).eq("status", "pending"),
    supabase
      .from("shift_posts")
      .select("id,category,shift_date,day_of_week,shift_start,shift_end,location_team,notes,poster_name_snapshot,status,created_at")
      .eq("station_id", profile?.station_id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const unreadCount = unreadResult.count ?? 0;
  const recentPosts = (recentPostsResult.data ?? []) as ShiftPostSummary[];

  return (
    <AppShell profile={profile} unreadCount={unreadCount}>
      <PageHeader
        eyebrow="Station dashboard"
        title={`Welcome, ${profile?.full_name || "teammate"}`}
        body="Your feed is scoped to your verified company, airport, and station."
        action={
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800" href="/posts/new">
            <Plus aria-hidden="true" size={18} />
            Post shift
          </Link>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Open station posts", value: openPostsResult.count ?? 0, icon: ClipboardList },
          { label: "My pending requests", value: myRequestsResult.count ?? 0, icon: Repeat2 },
          { label: "Unread notifications", value: unreadCount, icon: Bell },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" key={metric.label}>
              <Icon aria-hidden="true" className="text-teal-700" size={22} />
              <p className="mt-4 text-3xl font-bold text-zinc-950">{metric.value}</p>
              <p className="mt-1 text-sm font-medium text-zinc-600">{metric.label}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-950">Recent station posts</h2>
          <Link className="text-sm font-bold text-teal-700" href="/posts">
            View all
          </Link>
        </div>
        <div className="grid gap-3">
          {recentPosts.length ? (
            recentPosts.map((post) => <ShiftPostCard key={post.id} post={post} />)
          ) : (
            <EmptyState title="No posts yet" body="Be the first person to add a shift post for this station." actionHref="/posts/new" actionLabel="Create a post" />
          )}
        </div>
      </section>
    </AppShell>
  );
}
