import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ShiftPostCard, type ShiftPostSummary } from "@/components/shift-post-card";
import { getAuthenticatedContext } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MyPostsPage() {
  const { supabase, user, profile } = await getAuthenticatedContext();
  const [postsResult, unreadResult] = await Promise.all([
    supabase
      .from("shift_posts")
      .select("id,category,shift_date,day_of_week,shift_start,shift_end,location_team,notes,poster_name_snapshot,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);

  const posts = (postsResult.data ?? []) as ShiftPostSummary[];

  return (
    <AppShell profile={profile} unreadCount={unreadResult.count ?? 0}>
      <PageHeader
        eyebrow="My Posts"
        title="Posted shifts"
        body="Track your open, pending, and approved shift posts."
        action={
          <Link className="inline-flex min-h-11 items-center rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800" href="/posts/new">
            New post
          </Link>
        }
      />
      <section className="grid gap-3">
        {posts.length ? (
          posts.map((post) => <ShiftPostCard key={post.id} post={post} />)
        ) : (
          <EmptyState title="You have not posted yet" body="Create a shift post when you need coverage, a trade, or extra hours." actionHref="/posts/new" actionLabel="Post a shift" />
        )}
      </section>
    </AppShell>
  );
}
