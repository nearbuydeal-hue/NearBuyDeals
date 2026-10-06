import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  finishOnboardingFromMetadata,
  genericSetupError,
} from "@/lib/auth/complete-onboarding";

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  cookiesToSet: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }>,
) {
  const response = NextResponse.redirect(new URL(pathname, request.url));
  for (const cookie of cookiesToSet) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const code = request.nextUrl.searchParams.get("code");
  const cookiesToSet: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }> = [];

  if (!supabaseUrl || !supabaseAnonKey || !code) {
    return redirectWithCookies(request, "/login?message=confirmation", cookiesToSet);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookiesToSet.push(...cookies);
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("Auth confirmation callback failed:", error?.code);
    return redirectWithCookies(request, "/login?message=confirmation", cookiesToSet);
  }

  const onboarding = await finishOnboardingFromMetadata(data.user);
  if (onboarding.error) {
    await supabase.auth.signOut();
    console.error("Confirmed account could not finish shop onboarding.");
    return redirectWithCookies(
      request,
      "/signup?error=setup",
      cookiesToSet,
    );
  }

  if (!onboarding.completed) {
    await supabase.auth.signOut();
    return redirectWithCookies(request, "/login?error=shop-owner", cookiesToSet);
  }

  return redirectWithCookies(request, "/dashboard", cookiesToSet);
}
