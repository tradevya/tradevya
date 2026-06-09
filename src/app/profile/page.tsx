import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";
import { ROLE_LABELS } from "@/lib/constants";
import { getAuthenticatedContext } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { supabase, user, profile } = await getAuthenticatedContext();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return (
    <AppShell profile={profile} unreadCount={count ?? 0}>
      <PageHeader eyebrow="Profile" title="Work profile" body="Your location controls which station content you can access." />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <ProfileForm fullName={profile?.full_name ?? ""} />
        </section>
        <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-zinc-950">Current access</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="font-semibold text-zinc-500">Email</dt>
              <dd className="mt-1 text-zinc-900">{profile?.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-500">Company</dt>
              <dd className="mt-1 text-zinc-900">{profile?.custom_company_name || profile?.companies?.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-500">Airport</dt>
              <dd className="mt-1 text-zinc-900">{profile?.airports?.iata_code} - {profile?.airports?.city}</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-500">Station</dt>
              <dd className="mt-1 text-zinc-900">{profile?.stations?.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-500">Role</dt>
              <dd className="mt-1 text-zinc-900">{ROLE_LABELS[profile?.role ?? "regular_user"]}</dd>
            </div>
          </dl>
          <Link className="mt-5 inline-flex min-h-11 items-center rounded-md border border-zinc-300 px-4 text-sm font-bold text-zinc-700 hover:bg-zinc-50" href="/location-change">
            Request location change
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}
