"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isValidWorkEmail, normalizeEmail } from "@/lib/email";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionState = {
  ok: boolean;
  message: string;
};

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid work email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  company_id: z.string().trim().min(1, "Select your employer."),
  custom_company_name: z.string().trim().optional(),
  airport_id: z.string().trim().min(1, "Select your airport."),
  station_id: z.string().trim().min(1, "Select your station."),
});

export async function signUpAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured yet. Add the project URL and anon key to .env.local." };
  }

  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the signup form." };
  }

  const email = normalizeEmail(parsed.data.email);

  if (!isValidWorkEmail(email)) {
    return { ok: false, message: "Use a real work email. Personal email domains are blocked." };
  }

  const supabase = await createSupabaseServerClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { data: company } = await supabase
    .from("companies")
    .select("name,is_other")
    .eq("id", parsed.data.company_id)
    .single();

  if (company?.is_other && !parsed.data.custom_company_name) {
    return { ok: false, message: "Enter your company name when selecting Other." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      data: {
        full_name: parsed.data.full_name,
        company_id: parsed.data.company_id,
        custom_company_name: parsed.data.custom_company_name ?? "",
        airport_id: parsed.data.airport_id,
        station_id: parsed.data.station_id,
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid work email."),
  password: z.string().min(1, "Enter your password."),
});

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured yet. Add the project URL and anon key to .env.local." };
  }

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the login form." };
  }

  const email = normalizeEmail(parsed.data.email);

  if (!isValidWorkEmail(email)) {
    return { ok: false, message: "Tradevya only accepts work email accounts." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email_confirmed_at) {
    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  redirect("/dashboard");
}

export async function resendVerificationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured yet." };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!isValidWorkEmail(email)) {
    return { ok: false, message: "Enter the work email you used to sign up." };
  }

  const supabase = await createSupabaseServerClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Verification email sent. Check your work inbox." };
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
