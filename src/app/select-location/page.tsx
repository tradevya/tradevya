import { redirect } from "next/navigation";
import { AirportRequestForm } from "@/components/airport-request-form";
import { SelectLocationForm } from "@/components/auth-forms";
import { PageHeader } from "@/components/page-header";
import { getAuthenticatedContext, getDirectoryData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SelectLocationPage() {
  const [{ profile }, directory] = await Promise.all([
    getAuthenticatedContext({ requireCompleteProfile: false }),
    getDirectoryData(),
  ]);

  if (profile?.station_id) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-3 py-6 sm:px-4 sm:py-10">
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-7">
        <PageHeader
          eyebrow="Station setup"
          title="Select your company, airport, and station"
          body="Tradevya uses this location to scope your feed and shift marketplace access."
        />
        <SelectLocationForm airports={directory.airports} companies={directory.companies} stations={directory.stations} />
      </section>
      <div className="mt-5">
        <AirportRequestForm />
      </div>
    </main>
  );
}
