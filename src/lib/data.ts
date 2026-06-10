import { redirect } from "next/navigation";
import { demoAirports, demoCompanies, demoStations, type Airport, type Company, type Station } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  contact_phone: string | null;
  company_id: string | null;
  custom_company_name: string | null;
  airport_id: string | null;
  station_id: string | null;
  role: string;
  email_verified_at: string | null;
  blocked_at: string | null;
  blocked_reason: string | null;
  disabled_at: string | null;
  disabled_reason: string | null;
  companies?: { name: string } | null;
  airports?: { iata_code: string; name: string; city: string; state: string; latitude?: number | null; longitude?: number | null } | null;
  stations?: { name: string } | null;
};

export type DirectoryData = {
  companies: Company[];
  airports: Airport[];
  stations: Station[];
  configured: boolean;
};

export async function getDirectoryData(): Promise<DirectoryData> {
  if (!isSupabaseConfigured()) {
    return {
      companies: demoCompanies,
      airports: demoAirports,
      stations: demoStations,
      configured: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [companiesResult, airportsResult, stationsResult] = await Promise.all([
    supabase.from("companies").select("id,name,is_other").order("is_other").order("name"),
    supabase.from("airports").select("id,iata_code,name,city,state,latitude,longitude").order("iata_code"),
    supabase.from("stations").select("id,airport_id,name,description").order("name"),
  ]);

  return {
    companies: (companiesResult.data ?? demoCompanies) as Company[],
    airports: (airportsResult.data ?? demoAirports) as Airport[],
    stations: (stationsResult.data ?? demoStations) as Station[],
    configured: true,
  };
}

export async function getAuthenticatedContext(options?: { requireVerified?: boolean; requireCompleteProfile?: boolean }) {
  if (!isSupabaseConfigured()) {
    redirect("/login?setup=missing");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (options?.requireVerified !== false && !user.email_confirmed_at) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email ?? "")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, companies(name), airports(iata_code,name,city,state,latitude,longitude), stations(name)")
    .eq("id", user.id)
    .single();

  if (options?.requireVerified !== false && !profile?.email_verified_at) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email ?? "")}`);
  }

  if (profile?.blocked_at || profile?.disabled_at) {
    redirect("/login?blocked=1");
  }

  if (
    options?.requireCompleteProfile !== false &&
    (!profile?.company_id || !profile?.airport_id || !profile?.station_id)
  ) {
    redirect("/select-location");
  }

  return { supabase, user, profile: profile as Profile | null };
}

export async function getUnreadNotificationCount() {
  if (!isSupabaseConfigured()) return 0;

  const { supabase, user } = await getAuthenticatedContext({ requireCompleteProfile: false });
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return count ?? 0;
}
