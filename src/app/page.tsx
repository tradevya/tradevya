import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2, ClipboardList, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8f7]">
      <section className="relative min-h-[82vh] overflow-hidden bg-zinc-950 text-white">
        <Image
          alt="Airport employees coordinating shift coverage at an operations desk"
          className="object-cover opacity-65"
          fill
          priority
          sizes="100vw"
          src="/images/operations-hero.png"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-zinc-950/10" />
        <div className="relative mx-auto flex min-h-[82vh] max-w-6xl flex-col justify-center px-4 py-20">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-teal-100">
              Built for airport station teams
            </p>
            <h1 className="text-5xl font-bold leading-tight text-white sm:text-6xl">Tradevya</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-100">
              Replace shift group texts with a verified workplace marketplace for posting, claiming, and requesting shift changes inside the right company, airport, and station.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-teal-500 px-5 text-sm font-bold text-zinc-950 hover:bg-teal-300" href="/signup">
                Create account
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/30 px-5 text-sm font-bold text-white hover:bg-white/10" href="/login">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-4">
        {[
          { icon: ShieldCheck, title: "Work email only", body: "Personal email domains are blocked and verification is required." },
          { icon: ClipboardList, title: "Station feed", body: "Shift posts stay scoped to the employee's station." },
          { icon: Bell, title: "Request alerts", body: "Posters and requesters get in-app status notifications." },
          { icon: CheckCircle2, title: "Approval flow", body: "Posters approve or decline requests from one organized view." },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" key={item.title}>
              <Icon aria-hidden="true" className="text-teal-700" size={24} />
              <h2 className="mt-4 text-base font-bold text-zinc-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{item.body}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
