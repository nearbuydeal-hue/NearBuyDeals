"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  completeShopOwnerSignup,
  finishOnboardingFromMetadata,
} from "@/lib/auth/complete-onboarding";
import {
  getFirstValidationError,
  loginSchema,
  shopOwnerSignupSchema,
  shopDetailsSchema,
} from "@/lib/validation/auth";
import {
  createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "@/lib/supabase/server";

export type FormActionState = {
  error?: string;
  success?: string;
};

const genericSignupError =
  "We couldn’t create your account. Check your details and try again.";

function getFormValues(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(
    [...formData.entries()].filter(([name]) => !name.startsWith("$ACTION_")),
  );
}

export async function signupAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = shopOwnerSignupSchema.safeParse(getFormValues(formData));
  if (!parsed.success) {
    return { error: getFirstValidationError(parsed.error) };
  }

  if (!hasSupabaseServerConfig() || !process.env.SITE_URL) {
    return {
      error: "Shop signup is not configured yet. Please try again later.",
    };
  }

  const supabase = await createSupabaseServerClient();

  let emailRedirectTo: string;
  try {
    const siteURL = new URL(process.env.SITE_URL);
    if (
      !["http:", "https:"].includes(siteURL.protocol) ||
      siteURL.username ||
      siteURL.password
    ) {
      return {
        error: "Shop signup is not configured yet. Please try again later.",
      };
    }
    emailRedirectTo = new URL("/auth/callback", siteURL.origin).toString();
  } catch {
    return {
      error: "Shop signup is not configured yet. Please try again later.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo,
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
        shop_onboarding: {
          fullName: parsed.data.fullName,
          phone: parsed.data.phone,
          shopName: parsed.data.shopName,
          shopType: parsed.data.shopType,
          whatsapp: parsed.data.whatsapp,
          address: parsed.data.address,
          area: parsed.data.area,
          city: parsed.data.city,
        },
      },
    },
  });

  if (error) {
    console.error("Supabase signup failed:", error.code);
    return { error: genericSignupError };
  }

  if (data.session) {
    const result = await completeShopOwnerSignup(supabase, parsed.data);
    if (result.error) {
      await supabase.auth.signOut();
      return { error: result.error };
    }
    redirect("/dashboard");
  }

  return {
    success:
      "Check your email for a confirmation link. Your shop setup will finish after you confirm your address.",
  };
}

export async function loginAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = loginSchema.safeParse(getFormValues(formData));
  if (!parsed.success) {
    return { error: getFirstValidationError(parsed.error) };
  }

  if (!hasSupabaseServerConfig()) {
    return { error: "Login is not configured yet. Please try again later." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    if (error) {
      console.error("Supabase login failed:", error.code);
    }
    return { error: "Email or password is incorrect. Try again." };
  }

  const onboarding = await finishOnboardingFromMetadata(data.user, supabase);
  if (onboarding.error) {
    await supabase.auth.signOut();
    return { error: onboarding.error };
  }

  if (!onboarding.completed) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Could not verify the signed-in profile:", profileError.code);
      await supabase.auth.signOut();
      return { error: "We couldn’t verify this account. Try again later." };
    }

    if (profile?.role !== "shop_owner") {
      await supabase.auth.signOut();
      return {
        error: "This account does not have shop-owner access. Sign up as a shop owner to continue.",
      };
    }
  }

  redirect("/dashboard");
}

export async function logoutAction(
  _previousState: FormActionState,
  _formData: FormData,
): Promise<FormActionState> {
  void _previousState;
  void _formData;

  if (!hasSupabaseServerConfig()) {
    return { error: "Logout is not configured yet. Please try again later." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Supabase logout failed:", error.code);
    return { error: "We couldn’t sign you out. Please try again." };
  }

  redirect("/login?message=signed-out");
}

export async function updateShopAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = shopDetailsSchema.safeParse(getFormValues(formData));
  if (!parsed.success) {
    return { error: getFirstValidationError(parsed.error) };
  }

  if (!hasSupabaseServerConfig()) {
    return {
      error: "Shop editing is not configured yet. Please try again later.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Your session has expired. Sign in again to continue." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Could not verify shop-owner access:", profileError.code);
    return { error: "We couldn’t verify shop-owner access. Try again later." };
  }

  if (profile?.role !== "shop_owner") {
    return { error: "This account does not have shop-owner access." };
  }

  const { error: updateError } = await supabase.rpc(
    "update_my_shop_owner_details",
    {
      _full_name: parsed.data.fullName,
      _phone: parsed.data.phone,
      _shop_name: parsed.data.shopName,
      _shop_type: parsed.data.shopType,
      _whatsapp: parsed.data.whatsapp ?? null,
      _address: parsed.data.address,
      _area: parsed.data.area,
      _city: parsed.data.city,
    },
  );

  if (updateError) {
    console.error("Could not update shop information:", updateError.code);
    return { error: "We couldn’t save your shop details. Try again later." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/edit-shop");

  return { success: "Shop information saved." };
}
