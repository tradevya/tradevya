import Link from "next/link";
import { MailCheck } from "lucide-react";
import { ResendVerificationForm } from "@/components/auth-forms";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-3 py-6 sm:px-4 sm:py-10">
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-teal-50 text-teal-700">
          <MailCheck aria-hidden="true" size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-zinc-950 sm:text-3xl">Verify your work email</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Check your work inbox for the Supabase verification link. Dashboard, All Posts, Airport Board, Teams, Profile, and Notifications stay locked until verification is complete.
        </p>
        <ResendVerificationForm email={params.email} />
        <Link className="mt-4 inline-flex text-sm font-semibold text-teal-700" href="/login">
          Back to login
        </Link>
      </section>
    </main>
  );
}
