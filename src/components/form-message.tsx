import type { ActionState } from "@/app/actions/auth";

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;

  return (
    <p
      className={`rounded-md border px-3 py-2 text-sm ${
        state.ok ? "border-teal-200 bg-teal-50 text-teal-900" : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      {state.message}
    </p>
  );
}
