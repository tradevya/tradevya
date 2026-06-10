"use client";

import { useActionState } from "react";
import { updateOwnShiftPostAction } from "@/app/actions/marketplace";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { SHIFT_CATEGORIES } from "@/lib/constants";
import type { ActionState } from "@/app/actions/auth";

const initialState: ActionState = { ok: false, message: "" };

export type EditableShiftPost = {
  id: string;
  category: string;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  location_team: string | null;
  notes: string | null;
  status: string;
};

export function ShiftPostEditForm({ post }: { post: EditableShiftPost }) {
  const [state, action] = useActionState(updateOwnShiftPostAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <input name="post_id" type="hidden" value={post.id} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Category
          <select className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" defaultValue={post.category} name="category" required>
            {SHIFT_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Status
          <select className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" defaultValue={post.status === "closed" ? "closed" : "open"} name="status" required>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Date
          <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" defaultValue={post.shift_date} name="shift_date" required type="date" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Start
          <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" defaultValue={post.shift_start.slice(0, 5)} name="shift_start" required type="time" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          End
          <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" defaultValue={post.shift_end.slice(0, 5)} name="shift_end" required type="time" />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Location / team
        <input
          className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600"
          defaultValue={post.location_team ?? ""}
          name="location_team"
          placeholder="Gate C12, Ramp Team A, bag room, etc."
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Notes
        <textarea
          className="min-h-32 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          defaultValue={post.notes ?? ""}
          name="notes"
          placeholder="Add details coworkers need before requesting."
        />
      </label>

      <FormMessage state={state} />
      <SubmitButton pendingText="Saving...">Save post</SubmitButton>
    </form>
  );
}
