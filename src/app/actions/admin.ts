"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { shopModerationSchema } from "@/lib/validation/admin";

export type AdminActionState = {
  error?: string;
};

export async function moderateShopAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = shopModerationSchema.safeParse({
    shopId: formData.get("shopId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: "The requested shop action is invalid. Refresh and try again." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Admin moderation role lookup failed:", profileError.code);
    return { error: "The action could not be completed. Please try again." };
  }

  if (profile?.role !== "admin") {
    return { error: "You are not authorized to perform this action." };
  }

  const { error } = await supabase.rpc("set_shop_approval_status", {
    _shop_id: parsed.data.shopId,
    _status: parsed.data.status,
  });

  if (error) {
    console.error("Shop moderation failed:", error.code);
    return {
      error: "The shop status may have changed. Refresh the page and try again.",
    };
  }

  revalidatePath("/admin/shops");
  revalidatePath("/listings");
  revalidatePath("/dashboard");
  redirect(`/admin/shops?status=pending&success=${parsed.data.status}`);
}
