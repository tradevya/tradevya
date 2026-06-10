import Link from "next/link";
import { AirportRequestForm } from "@/components/airport-request-form";
import { ConfigNotice } from "@/components/config-notice";
import { SignupForm } from "@/components/auth-forms";
import { getDirectoryData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const directory = await getDirectoryData();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-3 py-6 sm:px-4 sm:py-10">
      <Link className="mb-6 text-sm font-bold text-teal-700" href="/">
        Tradevya
      </Link>
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase text-teal-700">Verified station access</p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-950 sm:text-3xl">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Sign up with your real work email and choose your employer, airport, and station.
        </p>
        {!directory.configured ? <div className="mt-5"><ConfigNotice /></div> : null}
        <div className="mt-6">
          <SignupForm airports={directory.airports} companies={directory.companies} stations={directory.stations} />
        </div>
      </section>
      <div className="mt-5">
        <AirportRequestForm />
      </div>
    </main>
  );
}
