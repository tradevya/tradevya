import Link from "next/link";
import { ConfigNotice } from "@/components/config-notice";
import { LoginForm } from "@/components/auth-forms";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ blocked?: string; setup?: string }>;
}) {
  const params = await searchParams;
  const showSetup = params.setup === "missing" || !isSupabaseConfigured();
  const isBlocked = params.blocked === "1";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-3 py-6 sm:px-4 sm:py-10">
      <Link className="mb-6 text-sm font-bold text-teal-700" href="/">
        Tradevya
      </Link>
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase text-teal-700">Work email required</p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-950 sm:text-3xl">Log in</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">Access opens after your work email is verified.</p>
        {isBlocked ? <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">This account is blocked. Contact the Tradevya backend owner for access.</p> : null}
        {showSetup ? <div className="mt-5"><ConfigNotice /></div> : null}
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
