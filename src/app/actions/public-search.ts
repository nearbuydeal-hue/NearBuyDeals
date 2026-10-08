"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicSearchSchema } from "@/lib/validation/public-search";

export async function searchListingsAction(formData: FormData): Promise<void> {
  const parsed = publicSearchSchema.safeParse({
    q: formData.get("q") ?? undefined,
    area: formData.get("area") ?? undefined,
  });

  if (!parsed.success) {
    redirect("/listings?error=search");
  }

  const params = new URLSearchParams();
  if (parsed.data.q) params.set("q", parsed.data.q);
  if (parsed.data.area) params.set("area", parsed.data.area);

  if (parsed.data.q || parsed.data.area) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.rpc("record_public_search");
      if (error) {
        console.error("Public search event could not be recorded:", error.code);
      }
    } catch (error) {
      console.error(
        "Public search event could not be recorded:",
        error instanceof Error ? error.name : "Unknown error",
      );
    }
  }

  redirect(params.size ? `/listings?${params.toString()}` : "/listings");
}
