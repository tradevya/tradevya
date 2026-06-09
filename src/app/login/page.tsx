import Link from "next/link";
import { ConfigNotice } from "@/components/config-notice";
import { LoginForm } from "@/components/auth-forms";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const params = await searchParams;
  const showSetup = params.setup === "missing" || !isSupabaseConfigured();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Link className="mb-6 text-sm font-bold text-teal-700" href="/">
        Tradevya
      </Link>
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase text-teal-700">Work email required</p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-950">Log in</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">Access opens after your work email is verified.</p>
        {showSetup ? <div className="mt-5"><ConfigNotice /></div> : null}
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
