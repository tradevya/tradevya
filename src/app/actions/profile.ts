"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthenticatedContext } from "@/lib/data";
import type { ActionState } from "@/app/actions/auth";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name."),
});

export async function updateProfileAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your profile." };
  }

  const { supabase, user } = await getAuthenticatedContext({ requireCompleteProfile: false });
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Profile updated." };
}

const locationSchema = z.object({
  company_id: z.string().trim().min(1, "Select your employer."),
  custom_company_name: z.string().trim().optional(),
  airport_id: z.string().trim().min(1, "Select your airport."),
  station_id: z.string().trim().min(1, "Select your station."),
});

export async function completeLocationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = locationSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your location." };
  }

  const { supabase, user, profile } = await getAuthenticatedContext({ requireCompleteProfile: false });

  if (profile?.station_id) {
    return { ok: false, message: "Use a location change request to move stations or airports." };
  }

  const { data: company } = await supabase
    .from("companies")
    .select("is_other")
    .eq("id", parsed.data.company_id)
    .single();

  if (company?.is_other && !parsed.data.custom_company_name) {
    return { ok: false, message: "Enter your company name when selecting Other." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      company_id: parsed.data.company_id,
      custom_company_name: parsed.data.custom_company_name || null,
      airport_id: parsed.data.airport_id,
      station_id: parsed.data.station_id,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  redirect("/dashboard");
}

const locationChangeSchema = locationSchema.extend({
  reason: z.string().trim().min(10, "Add a short reason for the request.").max(700),
});

export async function requestLocationChangeAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = locationChangeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your request." };
  }

  const { supabase, user, profile } = await getAuthenticatedContext();
  const { data: company } = await supabase
    .from("companies")
    .select("is_other")
    .eq("id", parsed.data.company_id)
    .single();

  if (company?.is_other && !parsed.data.custom_company_name) {
    return { ok: false, message: "Enter your company name when selecting Other." };
  }

  const { error } = await supabase.from("location_change_requests").insert({
    user_id: user.id,
    current_company_id: profile?.company_id,
    current_airport_id: profile?.airport_id,
    current_station_id: profile?.station_id,
    requested_company_id: parsed.data.company_id,
    requested_custom_company_name: parsed.data.custom_company_name || null,
    requested_airport_id: parsed.data.airport_id,
    requested_station_id: parsed.data.station_id,
    reason: parsed.data.reason,
    status: "pending",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Location change request submitted for admin review." };
}
