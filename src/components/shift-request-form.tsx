"use client";

import { useActionState } from "react";
import { submitShiftRequestAction } from "@/app/actions/marketplace";
import type { ActionState } from "@/app/actions/auth";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { ok: false, message: "" };

export function ShiftRequestForm({ postId, isDayTrade }: { postId: string; isDayTrade: boolean }) {
  const [state, action] = useActionState(submitShiftRequestAction, initialState);

  return (
    <form action={action} className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4">
      <input name="shift_post_id" type="hidden" value={postId} />

      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Request type
        <select
          className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
          disabled={!isDayTrade}
          name="request_type"
        >
          <option value="take_shift">Take this shift</option>
          {isDayTrade ? <option value="trade_proposal">Propose a trade</option> : null}
        </select>
      </label>

      {isDayTrade ? (
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold text-zinc-800">
            Trade date
            <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" name="proposed_shift_date" type="date" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-zinc-800">
            Start
            <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" name="proposed_start_time" type="time" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-zinc-800">
            End
            <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" name="proposed_end_time" type="time" />
          </label>
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Message
        <textarea
          className="min-h-28 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          name="message"
          placeholder="Add anything the poster should know."
        />
      </label>

      <FormMessage state={state} />
      <SubmitButton pendingText="Sending...">Submit request</SubmitButton>
    </form>
  );
}
