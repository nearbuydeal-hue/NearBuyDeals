import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutForm } from "@/components/auth/LogoutForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Shop dashboard | NearbyDeals",
  description: "View your shop information and approval status.",
};

const approvalMessages = {
  pending: {
    title: "Waiting for admin approval",
    description:
      "Your shop information has been received. Shop discovery features will remain unavailable until an admin approves your shop.",
    className: "border-amber-200 bg-amber-50 text-amber-950",
  },
  approved: {
    title: "Your shop is approved",
    description:
      "Your shop has been approved. Listing tools are not available yet.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  rejected: {
    title: "Your shop was not approved",
    description:
      "Your shop is not active. Please contact the NearbyDeals team if you need help.",
    className: "border-red-200 bg-red-50 text-red-950",
  },
  suspended: {
    title: "Your shop is suspended",
    description:
      "Your shop is currently not active. Please contact the NearbyDeals team if you need help.",
    className: "border-red-200 bg-red-50 text-red-950",
  },
} as const;

function formatShopType(shopType: string) {
  return shopType.charAt(0).toUpperCase() + shopType.slice(1);
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name, phone")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Dashboard profile query failed:", profileError.code);
    return <DashboardError />;
  }

  if (profile?.role !== "shop_owner") {
    return <ShopOwnerAccessRequired />;
  }

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select(
      "id, name, shop_type, phone, whatsapp, address, area, city, approval_status",
    )
    .eq("owner_id", authData.user.id)
    .maybeSingle();

  if (shopError) {
    console.error("Dashboard shop query failed:", shopError.code);
    return <DashboardError />;
  }

  if (!shop) {
    return <ShopMissing />;
  }

  const status =
    approvalMessages[shop.approval_status as keyof typeof approvalMessages];

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
              Shop owner dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
              Welcome, {profile.full_name ?? "shop owner"}
            </h1>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Review your account and shop information.
            </p>
          </div>
          <LogoutForm />
        </div>

        <section
          aria-labelledby="approval-heading"
          className={`mt-8 rounded-2xl border p-5 sm:p-6 ${status.className}`}
        >
          <h2 id="approval-heading" className="text-lg font-semibold">
            {status.title}
          </h2>
          <p className="mt-2 text-sm leading-6">{status.description}</p>
        </section>

        <section
          aria-labelledby="shop-heading"
          className="mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-800">Your shop</p>
              <h2
                id="shop-heading"
                className="mt-1 text-2xl font-semibold tracking-tight text-emerald-950"
              >
                {shop.name}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {formatShopType(shop.shop_type)}
              </p>
            </div>
            <Link
              href="/dashboard/edit-shop"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-900/20 px-5 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            >
              Edit shop information
            </Link>
          </div>

          <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <Detail label="Phone" value={shop.phone} />
            <Detail label="WhatsApp" value={shop.whatsapp ?? "Not provided"} />
            <Detail
              label="Address"
              value={`${shop.address}, ${shop.area}, ${shop.city}`}
            />
            <Detail label="Approval status" value={shop.approval_status} />
          </dl>
        </section>

        <section
          aria-labelledby="account-heading"
          className="mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"
        >
          <h2
            id="account-heading"
            className="text-xl font-semibold tracking-tight text-emerald-950"
          >
            Account information
          </h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <Detail label="Full name" value={profile.full_name ?? "Not provided"} />
            <Detail label="Email" value={authData.user.email ?? "Not provided"} />
            <Detail label="Phone" value={profile.phone ?? "Not provided"} />
          </dl>
        </section>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-base text-slate-900">{value}</dd>
    </div>
  );
}

function DashboardError() {
  return (
    <DashboardMessage
      title="Dashboard temporarily unavailable"
      description="We couldn’t load your account information. Please try again later."
    />
  );
}

function ShopMissing() {
  return (
    <DashboardMessage
      title="Shop information is not available"
      description="We couldn’t find a shop for this account. Please contact the NearbyDeals team for help."
    />
  );
}

function ShopOwnerAccessRequired() {
  return (
    <DashboardMessage
      title="Shop-owner access required"
      description="This account is not set up as a shop owner. Sign up with a shop-owner account to continue."
    />
  );
}

function DashboardMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main
      id="main-content"
      className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-emerald-950">
          {title}
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
        <div className="mt-6">
          <LogoutForm />
        </div>
      </div>
    </main>
  );
}
