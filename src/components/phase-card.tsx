import Link from "next/link";
import { AppPage } from "@/components/app-page";
import { PageHeader } from "@/components/page-header";

export function PhaseCard({
  eyebrow,
  title,
  body,
  bullets,
}: {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
}) {
  return (
    <AppPage>
      <PageHeader eyebrow={eyebrow} title={title} body={body} />
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-950">Planned scope</h2>
        <ul className="mt-4 grid gap-3 text-sm text-zinc-700">
          {bullets.map((bullet) => (
            <li className="border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0" key={bullet}>
              {bullet}
            </li>
          ))}
        </ul>
        <Link className="mt-5 inline-flex min-h-11 items-center rounded-md border border-zinc-300 px-4 text-sm font-bold text-zinc-700 hover:bg-zinc-50" href="/dashboard">
          Back to dashboard
        </Link>
      </section>
    </AppPage>
  );
}
