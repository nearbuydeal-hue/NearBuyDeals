import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GoogleShopSetupForm } from "@/components/auth/GoogleShopSetupForm";
import {
  createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Complete shop setup | NearbyDeals",
  description: "Add your shop details to finish creating your account.",
};

export default async function CompleteSignupPage() {
  if (!hasSupabaseServerConfig()) {
    redirect("/login?error=oauth");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/login?error=oauth-session");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error(
      "Could not verify profile for shop setup:",
      profileError?.code,
    );
    redirect("/login?error=oauth");
  }

  if (profile.role === "shop_owner") {
    redirect("/dashboard");
  }

  if (profile.role !== "customer") {
    redirect("/login?error=shop-owner");
  }

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Google sign-in
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
            Complete your shop setup
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Signed in as {userData.user.email ?? "your Google account"}. Add
            your shop details to submit it for review.
          </p>
          <div className="mt-7">
            <GoogleShopSetupForm />
          </div>
        </div>
      </div>
    </main>
  );
}
