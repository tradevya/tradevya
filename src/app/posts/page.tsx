import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ShiftPostCard, type ShiftPostSummary } from "@/components/shift-post-card";
import { DAYS_OF_WEEK, SHIFT_CATEGORIES } from "@/lib/constants";
import { getAuthenticatedContext } from "@/lib/data";

export const dynamic = "force-dynamic";

function selectedValues(value: string | string[] | undefined, allowed: readonly string[]) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values.filter((item) => allowed.includes(item));
}

function toggleHref({
  keyName,
  value,
  selectedCategories,
  selectedDays,
}: {
  keyName: "category" | "day";
  value: string;
  selectedCategories: string[];
  selectedDays: string[];
}) {
  const params = new URLSearchParams();
  const nextCategories = new Set(selectedCategories);
  const nextDays = new Set(selectedDays);

  if (keyName === "category") {
    if (nextCategories.has(value)) {
      nextCategories.delete(value);
    } else {
      nextCategories.add(value);
    }
  } else {
    if (nextDays.has(value)) {
      nextDays.delete(value);
    } else {
      nextDays.add(value);
    }
  }

  nextCategories.forEach((category) => params.append("category", category));
  nextDays.forEach((day) => params.append("day", day));

  const query = params.toString();
  return query ? `/posts?${query}` : "/posts";
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; day?: string | string[] }>;
}) {
  const params = await searchParams;
  const { supabase, user, profile } = await getAuthenticatedContext();
  const selectedCategories = selectedValues(params.category, SHIFT_CATEGORIES.map((category) => category.value));
  const selectedDays = selectedValues(params.day, DAYS_OF_WEEK);

  let query = supabase
    .from("shift_posts")
    .select("id,category,shift_date,day_of_week,shift_start,shift_end,location_team,notes,poster_name_snapshot,status,created_at")
    .eq("station_id", profile?.station_id)
    .order("shift_date", { ascending: true })
    .order("shift_start", { ascending: true });

  if (selectedCategories.length) {
    query = query.in("category", selectedCategories);
  }

  if (selectedDays.length) {
    query = query.in("day_of_week", selectedDays);
  }

  const [postsResult, unreadResult] = await Promise.all([
    query,
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);

  const posts = (postsResult.data ?? []) as ShiftPostSummary[];

  return (
    <AppShell profile={profile} unreadCount={unreadResult.count ?? 0}>
      <PageHeader
        eyebrow="All Posts"
        title="Station shift marketplace"
        body="Filter by one or more categories and weekdays. Empty filters show everything in your station."
        action={
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800" href="/posts/new">
            <Plus aria-hidden="true" size={18} />
            New post
          </Link>
        }
      />

      <section className="mb-5 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-950">Category</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {SHIFT_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category.value);
              return (
                <Link
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${isSelected ? "border-teal-700 bg-teal-700 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-teal-300"}`}
                  href={toggleHref({ keyName: "category", value: category.value, selectedCategories, selectedDays })}
                  key={category.value}
                >
                  {category.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold text-zinc-950">Day of week</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <Link
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${isSelected ? "border-amber-600 bg-amber-500 text-zinc-950" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-amber-300"}`}
                  href={toggleHref({ keyName: "day", value: day, selectedCategories, selectedDays })}
                  key={day}
                >
                  {day}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        {posts.length ? (
          posts.map((post) => <ShiftPostCard key={post.id} post={post} />)
        ) : (
          <EmptyState title="No matching posts" body="Try clearing a filter or create a new station post." actionHref="/posts/new" actionLabel="Create a post" />
        )}
      </section>
    </AppShell>
  );
}
