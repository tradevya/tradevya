"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import type { ActionState } from "@/app/actions/auth";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = { ok: false, message: "" };

export function ProfileForm({ fullName }: { fullName: string }) {
  const [state, action] = useActionState(updateProfileAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Full name
        <input
          className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600"
          defaultValue={fullName}
          name="full_name"
          required
        />
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Saving...">Save profile</SubmitButton>
    </form>
  );
}
