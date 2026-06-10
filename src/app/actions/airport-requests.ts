"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/app/actions/auth";
import { getAuthenticatedContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const airportRequestSchema = z.object({
  requester_email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  iata_code: z.string().trim().min(3, "Enter the 3-letter airport code.").max(3, "Use the 3-letter airport code."),
  name: z.string().trim().min(3, "Enter the airport name.").max(160),
  city: z.string().trim().min(2, "Enter the city.").max(100),
  state: z.string().trim().min(2, "Enter the state.").max(60),
  notes: z.string().trim().max(700).optional(),
});

const optionalCoordinate = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null || typeof value === "undefined" ? undefined : value),
    z.coerce.number().min(min).max(max).optional(),
  );

export async function submitAirportRequestAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured yet." };
  }

  const parsed = airportRequestSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the airport request." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const iataCode = parsed.data.iata_code.toUpperCase();

  const { data: existingAirport } = await supabase
    .from("airports")
    .select("id")
    .eq("iata_code", iataCode)
    .maybeSingle();

  if (existingAirport) {
    return { ok: true, message: `${iataCode} is already available in the airport list.` };
  }

  const { error } = await supabase.from("airport_requests").insert({
    requester_id: user?.id ?? null,
    requester_email: parsed.data.requester_email || user?.email || null,
    iata_code: iataCode,
    name: parsed.data.name,
    city: parsed.data.city,
    state: parsed.data.state.toUpperCase(),
    notes: parsed.data.notes || null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Airport request sent. An admin can review it in the backend." };
}

const approveAirportRequestSchema = z.object({
  request_id: z.string().uuid(),
  latitude: optionalCoordinate(-90, 90),
  longitude: optionalCoordinate(-180, 180),
  admin_note: z.string().trim().max(700).optional(),
});

export async function approveAirportRequestAction(formData: FormData) {
  const parsed = approveAirportRequestSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    revalidatePath("/admin/moderation");
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("approve_airport_request", {
    request_id: parsed.data.request_id,
    airport_latitude: parsed.data.latitude ?? null,
    airport_longitude: parsed.data.longitude ?? null,
    review_note: parsed.data.admin_note || null,
  });

  revalidatePath("/admin/moderation");
}

const rejectAirportRequestSchema = z.object({
  request_id: z.string().uuid(),
  admin_note: z.string().trim().max(700).optional(),
});

export async function rejectAirportRequestAction(formData: FormData) {
  const parsed = rejectAirportRequestSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    revalidatePath("/admin/moderation");
    return;
  }

  const { supabase } = await getAuthenticatedContext();
  await supabase.rpc("reject_airport_request", {
    request_id: parsed.data.request_id,
    review_note: parsed.data.admin_note || null,
  });

  revalidatePath("/admin/moderation");
}
