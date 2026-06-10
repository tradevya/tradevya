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

const profileDetailsSchema = userIdSchema.extend({
  email: z.string().trim().email(),
  full_name: z.string().trim().min(2),
  contact_phone: z.string().trim().max(40).optional(),
  company_id: z.string().uuid(),
  custom_company_name: z.string().trim().max(120).optional(),
  airport_id: z.string().uuid(),
  station_id: z.string().uuid(),
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

const shiftPostEditSchema = postIdSchema.extend({
  user_id: z.string().uuid(),
  category: z.enum(["pick_up", "give_away", "day_trade", "looking_for_double"]),
  shift_date: z.string().min(1),
  shift_start: z.string().min(1),
  shift_end: z.string().min(1),
  location_team: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
  status: z.enum(["open", "pending", "approved", "declined", "closed"]),
});

const deletePostSchema = postIdSchema.extend({
  confirm: z.string().trim(),
  user_id: z.string().uuid().optional(),
});

function revalidateAdminUser(userId?: string) {
  revalidatePath("/admin/moderation");
  if (userId) {
    revalidatePath(`/admin/users/${userId}`);
  }
}

export async function updateUserDetailsAction(formData: FormData) {
  const parsed = profileDetailsSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    revalidateAdminUser(String(formData.get("user_id") ?? ""));
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_update_profile_details", {
    target_user_id: parsed.data.user_id,
    new_email: parsed.data.email,
    new_full_name: parsed.data.full_name,
    new_contact_phone: parsed.data.contact_phone || "",
    new_company_id: parsed.data.company_id,
    new_custom_company_name: parsed.data.custom_company_name || "",
    new_airport_id: parsed.data.airport_id,
    new_station_id: parsed.data.station_id,
    new_role: parsed.data.role,
  });

  revalidateAdminUser(parsed.data.user_id);
}

export async function setUserRoleAction(formData: FormData) {
  const parsed = roleSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    revalidateAdminUser(String(formData.get("user_id") ?? ""));
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_update_profile_role", {
    target_user_id: parsed.data.user_id,
    new_role: parsed.data.role,
  });

  revalidateAdminUser(parsed.data.user_id);
}

export async function verifyUserAction(formData: FormData) {
  const parsed = userIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    revalidateAdminUser(String(formData.get("user_id") ?? ""));
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_verify_profile", {
    target_user_id: parsed.data.user_id,
  });

  revalidateAdminUser(parsed.data.user_id);
}

export async function deleteUserAction(formData: FormData) {
  const parsed = deleteUserSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success || parsed.data.confirm !== "DELETE") {
    revalidateAdminUser(String(formData.get("user_id") ?? ""));
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
    revalidateAdminUser(String(formData.get("user_id") ?? ""));
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_block_profile", {
    target_user_id: parsed.data.user_id,
    reason: parsed.data.reason || null,
  });

  revalidateAdminUser(parsed.data.user_id);
}

export async function unblockUserAction(formData: FormData) {
  const parsed = userIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    revalidateAdminUser(String(formData.get("user_id") ?? ""));
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_unblock_profile", {
    target_user_id: parsed.data.user_id,
  });

  revalidateAdminUser(parsed.data.user_id);
}

export async function disableUserAction(formData: FormData) {
  const parsed = blockUserSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    revalidateAdminUser(String(formData.get("user_id") ?? ""));
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_disable_profile", {
    target_user_id: parsed.data.user_id,
    reason: parsed.data.reason || null,
  });

  revalidateAdminUser(parsed.data.user_id);
}

export async function enableUserAction(formData: FormData) {
  const parsed = userIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    revalidateAdminUser(String(formData.get("user_id") ?? ""));
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_enable_profile", {
    target_user_id: parsed.data.user_id,
  });

  revalidateAdminUser(parsed.data.user_id);
}

export async function updateUserShiftPostAction(formData: FormData) {
  const parsed = shiftPostEditSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    revalidateAdminUser(String(formData.get("user_id") ?? ""));
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_update_shift_post", {
    target_post_id: parsed.data.post_id,
    new_category: parsed.data.category,
    new_shift_date: parsed.data.shift_date,
    new_shift_start: parsed.data.shift_start,
    new_shift_end: parsed.data.shift_end,
    new_location_team: parsed.data.location_team || "",
    new_notes: parsed.data.notes || "",
    new_status: parsed.data.status,
  });

  revalidateAdminUser(parsed.data.user_id);
}

export async function deleteShiftPostAction(formData: FormData) {
  const parsed = deletePostSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success || parsed.data.confirm !== "DELETE") {
    revalidateAdminUser(String(formData.get("user_id") ?? ""));
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("admin_delete_shift_post", {
    target_post_id: parsed.data.post_id,
  });

  revalidateAdminUser(parsed.data.user_id);
}
