import { AppShell } from "@/components/app-shell";
import { getAuthenticatedContext } from "@/lib/data";

export async function AppPage({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await getAuthenticatedContext();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return (
    <AppShell profile={profile} unreadCount={count ?? 0}>
      {children}
    </AppShell>
  );
}
