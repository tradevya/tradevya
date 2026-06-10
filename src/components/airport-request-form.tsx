"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { submitAirportRequestAction } from "@/app/actions/airport-requests";
import type { ActionState } from "@/app/actions/auth";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { ok: false, message: "" };

export function AirportRequestForm() {
  const [state, action] = useActionState(submitAirportRequestAction, initialState);

  return (
    <section className="rounded-lg border border-dashed border-teal-300 bg-teal-50/60 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-white text-teal-700">
          <Send aria-hidden size={18} />
        </span>
        <div>
          <h2 className="text-sm font-bold text-zinc-950">Airport not listed?</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Send a request and an admin can approve it from the backend. Approved airports appear in the selector.
          </p>
        </div>
      </div>

      <form action={action} className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
          <label className="grid gap-2 text-sm font-semibold text-zinc-800">
            Code
            <input
              className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm uppercase outline-none focus:border-teal-600"
              maxLength={3}
              name="iata_code"
              placeholder="MCO"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-zinc-800">
            Airport name
            <input
              className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
              name="name"
              placeholder="Orlando International Airport"
              required
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold text-zinc-800">
            City
            <input className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" name="city" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-zinc-800">
            State
            <input className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm uppercase outline-none focus:border-teal-600" maxLength={2} name="state" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-zinc-800">
            Your email
            <input className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600" name="requester_email" type="email" />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Note
          <textarea
            className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
            name="notes"
            placeholder="Optional: terminal, station, or employer context."
          />
        </label>
        <FormMessage state={state} />
        <SubmitButton pendingText="Sending request...">Request airport</SubmitButton>
      </form>
    </section>
  );
}
