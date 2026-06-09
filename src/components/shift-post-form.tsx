"use client";

import { useActionState } from "react";
import { createShiftPostAction } from "@/app/actions/marketplace";
import type { ActionState } from "@/app/actions/auth";
import { SHIFT_CATEGORIES } from "@/lib/constants";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { ok: false, message: "" };

export function ShiftPostForm() {
  const [state, action] = useActionState(createShiftPostAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Category
        <select className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" name="category" required>
          {SHIFT_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Date
          <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" name="shift_date" required type="date" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Start
          <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" name="shift_start" required type="time" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          End
          <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" name="shift_end" required type="time" />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Location / team
        <input
          className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600"
          name="location_team"
          placeholder="Gate C12, Ramp Team A, bag room, etc."
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Notes
        <textarea
          className="min-h-32 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          name="notes"
          placeholder="Add details coworkers need before requesting."
        />
      </label>

      <FormMessage state={state} />
      <SubmitButton pendingText="Posting...">Post shift</SubmitButton>
    </form>
  );
}
