import Link from "next/link";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/marketplace";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { formatDateTime } from "@/lib/format";
import { getAuthenticatedContext } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const { supabase, user, profile } = await getAuthenticatedContext();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,title,body,type,shift_post_id,read_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const unreadCount = notifications?.filter((notification) => !notification.read_at).length ?? 0;

  return (
    <AppShell profile={profile} unreadCount={unreadCount}>
      <PageHeader
        eyebrow="Notifications"
        title="Station alerts"
        body="Requests, approvals, and declines appear here."
        action={
          unreadCount ? (
            <form action={markAllNotificationsReadAction}>
              <button className="min-h-11 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-700 hover:bg-zinc-50" type="submit">
                Mark all read
              </button>
            </form>
          ) : null
        }
      />
      <section className="grid gap-3">
        {notifications?.length ? (
          notifications.map((notification) => (
            <article className={`rounded-lg border p-4 shadow-sm ${notification.read_at ? "border-zinc-200 bg-white" : "border-red-300 bg-red-50"}`} key={notification.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-bold text-zinc-950">{notification.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-700">{notification.body}</p>
                  <p className="mt-2 text-xs font-medium text-zinc-500">{formatDateTime(notification.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  {notification.shift_post_id ? (
                    <Link className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-zinc-700 hover:bg-zinc-50" href={`/posts/${notification.shift_post_id}`}>
                      Open
                    </Link>
                  ) : null}
                  {!notification.read_at ? (
                    <form action={markNotificationReadAction}>
                      <input name="notification_id" type="hidden" value={notification.id} />
                      <button className="rounded-md bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700" type="submit">
                        Read
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState title="No notifications" body="Shift request activity will appear here." />
        )}
      </section>
    </AppShell>
  );
}
