import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ShiftPostEditForm, type EditableShiftPost } from "@/components/shift-post-edit-form";
import { getAuthenticatedContext } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EditShiftPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, profile } = await getAuthenticatedContext();
  const [postResult, unreadResult] = await Promise.all([
    supabase
      .from("shift_posts")
      .select("id,user_id,category,shift_date,shift_start,shift_end,location_team,notes,status")
      .eq("id", id)
      .single(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);

  const post = postResult.data as (EditableShiftPost & { user_id: string | null }) | null;

  if (!post || post.user_id !== user.id) {
    notFound();
  }

  return (
    <AppShell profile={profile} unreadCount={unreadResult.count ?? 0}>
      <Link className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-teal-700" href={`/posts/${post.id}`}>
        <ArrowLeft aria-hidden="true" size={16} />
        Back to post
      </Link>
      <PageHeader eyebrow="Edit post" title="Update shift post" body="Edit the details or close the post when plans change." />
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <ShiftPostEditForm post={post} />
      </section>
    </AppShell>
  );
}
