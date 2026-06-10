"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthenticatedContext } from "@/lib/data";

const userIdSchema = z.object({
  user_id: z.string().uuid(),
});

const roleSchema = userIdSchema.extend({
  role: z.enum(["regular_user", "station_admin", "airport_admin"]),
});

const deleteUserSchema = userIdSchema.extend({
  confirm: z.string().trim(),
});

const blockUserSchema = userIdSchema.extend({
  reason: z.string().trim().max(240).optional(),
});

const postIdSchema = z.object({
  post_id: z.string().uuid(),
});

const deletePostSchema = postIdSchema.extend({
  confirm: z.string().trim(),
});

export async function setUserRoleAction(formData: FormData) {
  const parsed = roleSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    revalidatePath("/admin/moderation");
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_update_profile_role", {
    target_user_id: parsed.data.user_id,
    new_role: parsed.data.role,
  });

  revalidatePath("/admin/moderation");
}

export async function verifyUserAction(formData: FormData) {
  const parsed = userIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    revalidatePath("/admin/moderation");
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_verify_profile", {
    target_user_id: parsed.data.user_id,
  });

  revalidatePath("/admin/moderation");
}

export async function deleteUserAction(formData: FormData) {
  const parsed = deleteUserSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success || parsed.data.confirm !== "DELETE") {
    revalidatePath("/admin/moderation");
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_delete_user", {
    target_user_id: parsed.data.user_id,
  });

  revalidatePath("/admin/moderation");
}

export async function blockUserAction(formData: FormData) {
  const parsed = blockUserSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    revalidatePath("/admin/moderation");
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_block_profile", {
    target_user_id: parsed.data.user_id,
    reason: parsed.data.reason || null,
  });

  revalidatePath("/admin/moderation");
}

export async function unblockUserAction(formData: FormData) {
  const parsed = userIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    revalidatePath("/admin/moderation");
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_unblock_profile", {
    target_user_id: parsed.data.user_id,
  });

  revalidatePath("/admin/moderation");
}

export async function deleteShiftPostAction(formData: FormData) {
  const parsed = deletePostSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success || parsed.data.confirm !== "DELETE") {
    revalidatePath("/admin/moderation");
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_delete_shift_post", {
    target_post_id: parsed.data.post_id,
  });

  revalidatePath("/admin/moderation");
}
