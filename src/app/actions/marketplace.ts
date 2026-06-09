"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { SHIFT_CATEGORIES } from "@/lib/constants";
import { dayOfWeekFromDate } from "@/lib/format";
import { getAuthenticatedContext } from "@/lib/data";
import type { ActionState } from "@/app/actions/auth";

const shiftCategoryValues = SHIFT_CATEGORIES.map((category) => category.value) as [string, ...string[]];

const createShiftPostSchema = z.object({
  category: z.enum(shiftCategoryValues),
  shift_date: z.string().min(1, "Choose a shift date."),
  shift_start: z.string().min(1, "Enter the shift start time."),
  shift_end: z.string().min(1, "Enter the shift end time."),
  location_team: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function createShiftPostAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createShiftPostSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the post form." };
  }

  const { supabase, user, profile } = await getAuthenticatedContext();

  if (!profile?.station_id || !profile.airport_id) {
    return { ok: false, message: "Complete your company, airport, and station before posting." };
  }

  const { error } = await supabase.from("shift_posts").insert({
    user_id: user.id,
    company_id: profile.company_id,
    airport_id: profile.airport_id,
    station_id: profile.station_id,
    poster_name_snapshot: profile.full_name || user.email || "Tradevya member",
    category: parsed.data.category,
    shift_date: parsed.data.shift_date,
    day_of_week: dayOfWeekFromDate(parsed.data.shift_date),
    shift_start: parsed.data.shift_start,
    shift_end: parsed.data.shift_end,
    location_team: parsed.data.location_team || null,
    notes: parsed.data.notes || null,
    status: "open",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  redirect("/posts");
}

const submitRequestSchema = z.object({
  shift_post_id: z.string().uuid(),
  request_type: z.enum(["take_shift", "trade_proposal"]),
  proposed_shift_date: z.string().optional(),
  proposed_start_time: z.string().optional(),
  proposed_end_time: z.string().optional(),
  message: z.string().trim().max(700).optional(),
});

export async function submitShiftRequestAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = submitRequestSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the request form." };
  }

  const { supabase, user, profile } = await getAuthenticatedContext();
  const { data: post, error: postError } = await supabase
    .from("shift_posts")
    .select("id,user_id,station_id,category,status,shift_date,shift_start,shift_end")
    .eq("id", parsed.data.shift_post_id)
    .single();

  if (postError || !post) {
    return { ok: false, message: "That shift post is not available." };
  }

  if (post.station_id !== profile?.station_id) {
    return { ok: false, message: "You can only request shifts in your station." };
  }

  if (post.user_id === user.id) {
    return { ok: false, message: "You cannot request your own shift post." };
  }

  if (post.status === "approved" || post.status === "closed") {
    return { ok: false, message: "That post is no longer open for requests." };
  }

  const requestType = post.category === "day_trade" ? parsed.data.request_type : "take_shift";
  const { data: request, error } = await supabase
    .from("shift_requests")
    .insert({
      shift_post_id: post.id,
      requester_id: user.id,
      request_type: requestType,
      proposed_shift_date: parsed.data.proposed_shift_date || null,
      proposed_start_time: parsed.data.proposed_start_time || null,
      proposed_end_time: parsed.data.proposed_end_time || null,
      message: parsed.data.message || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  await supabase.from("shift_posts").update({ status: "pending" }).eq("id", post.id);

  if (post.user_id) {
    await supabase.from("notifications").insert({
      user_id: post.user_id,
      actor_id: user.id,
      type: "shift_request_submitted",
      title: "New shift request",
      body: `${profile?.full_name || "A station coworker"} requested your ${dayOfWeekFromDate(post.shift_date)} shift.`,
      shift_post_id: post.id,
      shift_request_id: request?.id,
    });
  }

  redirect(`/posts/${post.id}?request=submitted`);
}

const respondRequestSchema = z.object({
  shift_request_id: z.string().uuid(),
  response: z.enum(["approved", "declined"]),
});

export async function respondToShiftRequestAction(formData: FormData) {
  const parsed = respondRequestSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/my-posts?error=request");
  }

  const { supabase, user, profile } = await getAuthenticatedContext();
  const { data: request } = await supabase
    .from("shift_requests")
    .select("id,requester_id,shift_post_id,shift_posts(id,user_id,shift_date,shift_start,shift_end)")
    .eq("id", parsed.data.shift_request_id)
    .single();

  const post = Array.isArray(request?.shift_posts) ? request?.shift_posts[0] : request?.shift_posts;

  if (!request || !post || post.user_id !== user.id) {
    redirect("/my-posts?error=not-owner");
  }

  await supabase
    .from("shift_requests")
    .update({
      status: parsed.data.response,
      responder_id: user.id,
      responded_at: new Date().toISOString(),
    })
    .eq("id", request.id);

  await supabase
    .from("shift_posts")
    .update({ status: parsed.data.response === "approved" ? "approved" : "open" })
    .eq("id", post.id);

  await supabase.from("notifications").insert({
    user_id: request.requester_id,
    actor_id: user.id,
    type: parsed.data.response === "approved" ? "shift_request_approved" : "shift_request_declined",
    title: parsed.data.response === "approved" ? "Request approved" : "Request declined",
    body:
      parsed.data.response === "approved"
        ? `${profile?.full_name || "The poster"} approved your shift request.`
        : `${profile?.full_name || "The poster"} declined your shift request.`,
    shift_post_id: post.id,
    shift_request_id: request.id,
  });

  redirect(`/posts/${post.id}?response=${parsed.data.response}`);
}

export async function markNotificationReadAction(formData: FormData) {
  const notificationId = String(formData.get("notification_id") ?? "");
  const { supabase, user } = await getAuthenticatedContext();

  if (notificationId) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id);
  }

  redirect("/notifications");
}

export async function markAllNotificationsReadAction() {
  const { supabase, user } = await getAuthenticatedContext();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  redirect("/notifications");
}
