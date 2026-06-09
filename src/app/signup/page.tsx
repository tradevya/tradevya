import Link from "next/link";
import { ConfigNotice } from "@/components/config-notice";
import { SignupForm } from "@/components/auth-forms";
import { getDirectoryData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const directory = await getDirectoryData();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10">
      <Link className="mb-6 text-sm font-bold text-teal-700" href="/">
        Tradevya
      </Link>
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase text-teal-700">Verified station access</p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-950">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Sign up with your real work email and choose your employer, airport, and station.
        </p>
        {!directory.configured ? <div className="mt-5"><ConfigNotice /></div> : null}
        <div className="mt-6">
          <SignupForm airports={directory.airports} companies={directory.companies} stations={directory.stations} />
        </div>
      </section>
    </main>
  );
}
