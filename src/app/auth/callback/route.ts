import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id && user.email_confirmed_at) {
        await supabase
          .from("profiles")
          .update({ email_verified_at: new Date().toISOString() })
          .eq("id", user.id)
          .is("email_verified_at", null);
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
