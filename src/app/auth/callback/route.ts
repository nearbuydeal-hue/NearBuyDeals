import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { finishOnboardingFromMetadata } from "@/lib/auth/complete-onboarding";
import type { Database } from "@/types/database";

function redirectWithCookies(
  siteOrigin: string,
  pathname: string,
  cookiesToSet: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }>,
) {
  const response = NextResponse.redirect(new URL(pathname, siteOrigin));
  for (const cookie of cookiesToSet) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const configuredSiteUrl = process.env.SITE_URL;
  const code = request.nextUrl.searchParams.get("code");
  const cookiesToSet: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }> = [];

  let siteOrigin: string;
  try {
    if (!configuredSiteUrl) {
      throw new Error("SITE_URL is missing.");
    }

    const siteUrl = new URL(configuredSiteUrl);
    if (
      !["http:", "https:"].includes(siteUrl.protocol) ||
      siteUrl.username ||
      siteUrl.password
    ) {
      throw new Error("SITE_URL is invalid.");
    }
    siteOrigin = siteUrl.origin;
  } catch {
    return NextResponse.json(
      { error: "Authentication is not configured for this environment." },
      { status: 503 },
    );
  }

  if (!supabaseUrl || !supabaseAnonKey || !code) {
    return redirectWithCookies(
      siteOrigin,
      "/login?message=confirmation",
      cookiesToSet,
    );
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookiesToSet.push(...cookies);
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("Auth confirmation callback failed:", error?.code);
    return redirectWithCookies(
      siteOrigin,
      "/login?message=confirmation",
      cookiesToSet,
    );
  }

  const onboarding = await finishOnboardingFromMetadata(data.user, supabase);
  if (onboarding.error) {
    await supabase.auth.signOut();
    console.error("Confirmed account could not finish shop onboarding.");
    return redirectWithCookies(
      siteOrigin,
      "/signup?error=setup",
      cookiesToSet,
    );
  }

  if (!onboarding.completed) {
    await supabase.auth.signOut();
    return redirectWithCookies(
      siteOrigin,
      "/login?error=shop-owner",
      cookiesToSet,
    );
  }

  return redirectWithCookies(siteOrigin, "/dashboard", cookiesToSet);
}
