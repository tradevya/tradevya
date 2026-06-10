import Link from "next/link";
import { Bell, ClipboardList, Repeat2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ShiftPostCard, type ShiftPostSummary } from "@/components/shift-post-card";
import { EmptyState } from "@/components/empty-state";
import { DAYS_OF_WEEK, SHIFT_CATEGORIES } from "@/lib/constants";
import { getAuthenticatedContext } from "@/lib/data";

export const dynamic = "force-dynamic";

const shortDays: Record<string, string> = {
  Monday: "Mo",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thurs",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

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
  } else if (nextDays.has(value)) {
    nextDays.delete(value);
  } else {
    nextDays.add(value);
  }

  nextCategories.forEach((category) => params.append("category", category));
  nextDays.forEach((day) => params.append("day", day));

  const query = params.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; day?: string | string[] }>;
}) {
  const params = await searchParams;
  const { supabase, user, profile } = await getAuthenticatedContext();
  const selectedCategories = selectedValues(params.category, SHIFT_CATEGORIES.map((category) => category.value));
  const selectedDays = selectedValues(params.day, DAYS_OF_WEEK);

  let postsQuery = supabase
    .from("shift_posts")
    .select("id,category,shift_date,day_of_week,shift_start,shift_end,location_team,notes,poster_name_snapshot,status,created_at")
    .eq("station_id", profile?.station_id)
    .order("shift_date", { ascending: true })
    .order("shift_start", { ascending: true });

  if (selectedCategories.length) {
    postsQuery = postsQuery.in("category", selectedCategories);
  }

  if (selectedDays.length) {
    postsQuery = postsQuery.in("day_of_week", selectedDays);
  }

  const [unreadResult, myPostsResult, myRequestsResult, postsResult] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
    supabase.from("shift_posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("shift_requests").select("id", { count: "exact", head: true }).eq("requester_id", user.id).eq("status", "pending"),
    postsQuery,
  ]);

  const unreadCount = unreadResult.count ?? 0;
  const posts = (postsResult.data ?? []) as ShiftPostSummary[];

  return (
    <AppShell profile={profile} unreadCount={unreadCount}>
      <PageHeader
        eyebrow="Station dashboard"
        title={`Welcome, ${profile?.full_name || "teammate"}`}
      />

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { href: "/my-posts", label: "My Posts", value: myPostsResult.count ?? 0, icon: ClipboardList, urgent: false },
          { href: "/my-requests", label: "Pending", value: myRequestsResult.count ?? 0, icon: Repeat2, urgent: false },
          { href: "/notifications", label: "Alerts", value: unreadCount, icon: Bell, urgent: unreadCount > 0 },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <Link
              className={`rounded-md border p-2.5 shadow-sm sm:p-4 ${
                metric.urgent ? "border-red-300 bg-red-50 text-red-800" : "border-zinc-200 bg-white text-zinc-950"
              }`}
              href={metric.href}
              key={metric.label}
            >
              <Icon aria-hidden="true" className={metric.urgent ? "text-red-600" : "text-teal-700"} size={20} />
              <p className={`mt-3 text-2xl font-extrabold sm:text-3xl ${metric.urgent ? "text-red-700" : "text-zinc-950"}`}>{metric.value}</p>
              <p className={`mt-1 truncate text-[11px] font-bold sm:text-sm ${metric.urgent ? "text-red-700" : "text-zinc-600"}`}>{metric.label}</p>
            </Link>
          );
        })}
      </section>

      <section className="mt-7">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-zinc-950">All posts</h2>
        </div>

        <div className="mb-4 grid gap-3 rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
          <div>
            <p className="text-xs font-extrabold uppercase text-zinc-500">Category</p>
            <div className="mt-2 grid grid-cols-4 gap-1.5 sm:gap-2">
              {SHIFT_CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category.value);
                return (
                  <Link
                    className={`flex min-h-10 items-center justify-center rounded-md border px-1 text-center text-[11px] font-extrabold sm:text-sm ${
                      isSelected ? "border-teal-700 bg-teal-700 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-teal-300"
                    }`}
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
            <p className="text-xs font-extrabold uppercase text-zinc-500">Days</p>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <Link
                    className={`flex min-h-9 items-center justify-center rounded-md border px-0.5 text-[10px] font-extrabold sm:text-sm ${
                      isSelected ? "border-sky-600 bg-sky-500 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-sky-300"
                    }`}
                    href={toggleHref({ keyName: "day", value: day, selectedCategories, selectedDays })}
                    key={day}
                  >
                    {shortDays[day]}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 sm:gap-3">
          {posts.length ? (
            posts.map((post, index) => <ShiftPostCard emphasis={index % 2 === 0} key={post.id} post={post} />)
          ) : (
            <EmptyState title="No matching posts" body="Try clearing a filter or create a new station post." actionHref="/posts/new" actionLabel="Create a post" />
          )}
        </div>
      </section>
    </AppShell>
  );
}
