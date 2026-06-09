import { categoryLabel, statusLabel } from "@/lib/format";

const statusStyles: Record<string, string> = {
  open: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-teal-200 bg-teal-50 text-teal-800",
  declined: "border-rose-200 bg-rose-50 text-rose-800",
  closed: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

const categoryStyles: Record<string, string> = {
  pick_up: "border-sky-200 bg-sky-50 text-sky-800",
  give_away: "border-teal-200 bg-teal-50 text-teal-800",
  day_trade: "border-violet-200 bg-violet-50 text-violet-800",
  looking_for_double: "border-amber-200 bg-amber-50 text-amber-800",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[value] ?? statusStyles.closed}`}>
      {statusLabel(value)}
    </span>
  );
}

export function CategoryBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${categoryStyles[value] ?? categoryStyles.give_away}`}>
      {categoryLabel(value)}
    </span>
  );
}
