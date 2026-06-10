import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { categoryLabel, formatShortDate, formatTime } from "@/lib/format";

export type ShiftPostSummary = {
  id: string;
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

export function ShiftPostCard({ post, emphasis = false }: { post: ShiftPostSummary; emphasis?: boolean }) {
  const category = categoryLabel(post.category);

  return (
    <Link
      className={`block rounded-md border p-3 shadow-sm transition hover:border-sky-400 hover:shadow-md sm:p-4 ${
        emphasis ? "border-sky-200 bg-sky-50" : "border-zinc-200 bg-white"
      }`}
      href={`/posts/${post.id}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-extrabold uppercase tracking-normal text-zinc-950 sm:text-base">{category}</p>
            <StatusBadge value={post.status} />
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-zinc-700">
            {formatShortDate(post.shift_date)} {post.day_of_week} {formatTime(post.shift_start)} to {formatTime(post.shift_end)}
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs font-bold text-sky-700">
            Tap for details
            <ChevronRight aria-hidden="true" size={14} />
          </p>
        </div>
        <div className="text-right">
          {post.location_team ? <p className="max-w-24 truncate text-xs font-semibold text-zinc-500 sm:max-w-36">{post.location_team}</p> : null}
        </div>
      </div>
      <p className="sr-only">Posted by {post.poster_name_snapshot || "Tradevya member"}{post.notes ? `. Notes: ${post.notes}` : ""}</p>
    </Link>
  );
}
