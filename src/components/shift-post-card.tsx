import Link from "next/link";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { CategoryBadge, StatusBadge } from "@/components/status-badge";
import { formatDate, formatTime } from "@/lib/format";

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

export function ShiftPostCard({ post }: { post: ShiftPostSummary }) {
  return (
    <Link className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-teal-300 hover:shadow-md" href={`/posts/${post.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge value={post.category} />
        <StatusBadge value={post.status} />
      </div>
      <div className="mt-4 grid gap-3">
        <h2 className="text-lg font-bold text-zinc-950">{post.day_of_week} shift</h2>
        <div className="grid gap-2 text-sm text-zinc-600 sm:grid-cols-3">
          <span className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" size={16} />
            {formatDate(post.shift_date)}
          </span>
          <span className="flex items-center gap-2">
            <Clock aria-hidden="true" size={16} />
            {formatTime(post.shift_start)} - {formatTime(post.shift_end)}
          </span>
          <span className="flex items-center gap-2">
            <MapPin aria-hidden="true" size={16} />
            {post.location_team || "Station area"}
          </span>
        </div>
        {post.notes ? <p className="line-clamp-2 text-sm leading-6 text-zinc-700">{post.notes}</p> : null}
        <p className="text-xs font-medium text-zinc-500">Posted by {post.poster_name_snapshot || "Tradevya member"}</p>
      </div>
    </Link>
  );
}
