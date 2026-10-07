import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShopEditForm } from "@/components/auth/ShopEditForm";
import {
  createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit shop information | NearbyDeals",
  description: "Update your shop contact and location information.",
  robots: { index: false, follow: false },
};

export default async function EditShopPage() {
  if (!hasSupabaseServerConfig()) {
    return <EditShopError />;
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Edit-shop profile query failed:", profileError.code);
    return <EditShopError />;
  }

  if (profile?.role !== "shop_owner") {
    redirect("/dashboard");
  }

  const { data: shopId, error: shopIdError } = await supabase.rpc(
    "get_my_shop_id",
  );

  if (shopIdError) {
    console.error("Edit-shop lookup failed:", shopIdError.code);
    return <EditShopError />;
  }

  if (!shopId) {
    redirect("/dashboard");
  }

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("name, shop_type, phone, whatsapp, address, area, city")
    .eq("id", shopId)
    .maybeSingle();

  if (shopError) {
    console.error("Edit-shop query failed:", shopError.code);
    return <EditShopError />;
  }

  if (!shop) {
    redirect("/dashboard");
  }

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-emerald-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          Back to dashboard
        </Link>
        <section className="mt-5 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Shop information
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950">
            Edit your shop
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Your owner account and approval status can only be changed by an
            authorized admin.
          </p>
          <div className="mt-7">
            <ShopEditForm
              shop={{
                fullName: profile.full_name ?? "",
                shopName: shop.name,
                shopType: shop.shop_type,
                phone: shop.phone,
                whatsapp: shop.whatsapp ?? "",
                address: shop.address,
                area: shop.area,
                city: shop.city,
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function EditShopError() {
  return (
    <main
      id="main-content"
      className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-emerald-950">
          Shop information temporarily unavailable
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          We couldn’t load your shop information. Please try again later.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-11 items-center rounded-full border border-emerald-900/20 px-5 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
