import Link from "next/link";

export function ConfigNotice() {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      Supabase is not connected yet. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to
      `.env.local`, then run the SQL in `supabase/migrations` and `supabase/seed`.
      <Link className="ml-1 font-semibold underline" href="/login?setup=missing">
        Login is disabled until then.
      </Link>
    </div>
  );
}
