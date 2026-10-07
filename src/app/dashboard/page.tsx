import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutForm } from "@/components/auth/LogoutForm";
import { MetricCard } from "@/components/metrics/MetricCard";
import {
  createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "@/lib/supabase/server";
import {
  metricsPeriodSchema,
  shopMetricsSchema,
  type MetricsPeriod,
} from "@/lib/validation/metrics";

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
      "Your shop has been approved. You can manage listings and review customer activity.",
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

function isApprovalStatus(
  status: string,
): status is keyof typeof approvalMessages {
  return Object.hasOwn(approvalMessages, status);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  if (!hasSupabaseServerConfig()) {
    return <DashboardNotConfigured />;
  }

  const params = await searchParams;
  const periodResult = metricsPeriodSchema.safeParse(params.period);
  const period: MetricsPeriod = periodResult.success ? periodResult.data : "all";
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

  const { data: shopId, error: shopIdError } = await supabase.rpc(
    "get_my_shop_id",
  );

  if (shopIdError) {
    console.error("Dashboard shop lookup failed:", shopIdError.code);
    return <DashboardError />;
  }

  if (!shopId) {
    return <ShopMissing />;
  }

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select(
      "id, name, shop_type, phone, whatsapp, address, area, city, approval_status",
    )
    .eq("id", shopId)
    .maybeSingle();

  if (shopError) {
    console.error("Dashboard shop query failed:", shopError.code);
    return <DashboardError />;
  }

  if (!shop) {
    return <ShopMissing />;
  }

  if (!isApprovalStatus(shop.approval_status)) {
    console.error("Dashboard shop has an unsupported approval status.");
    return <DashboardError />;
  }

  const { data: rawMetrics, error: metricsError } = await supabase.rpc(
    "get_my_shop_metrics",
    { _period: period },
  );
  const parsedMetrics = metricsError
    ? null
    : shopMetricsSchema.safeParse(rawMetrics);

  if (metricsError) {
    console.error("Shop metrics query failed:", metricsError.code);
  } else if (!parsedMetrics?.success) {
    console.error("Shop metrics response had an unexpected shape.");
  }

  const status = approvalMessages[shop.approval_status];

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
          aria-labelledby="shop-metrics-heading"
          className="mt-6 rounded-3xl border border-emerald-950/10 bg-[#f8f9f5] p-5 sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
                Shop activity
              </p>
              <h2
                id="shop-metrics-heading"
                className="mt-2 text-2xl font-semibold tracking-tight text-emerald-950"
              >
                Your metrics
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Counts are based on listing and contact activity.
              </p>
            </div>
            <form method="get" className="flex flex-wrap items-end gap-2">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Time period
                <select
                  name="period"
                  defaultValue={period}
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="all">All time</option>
                </select>
              </label>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-900/20 px-4 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              >
                Apply
              </button>
            </form>
          </div>

          {parsedMetrics?.success ? (
            <>
              <ul className="mt-5 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard label="Total listings" value={parsedMetrics.data.totalListings} />
                <MetricCard label="Active listings" value={parsedMetrics.data.activeListings} />
                <MetricCard label="Sold-out listings" value={parsedMetrics.data.soldOutListings} />
                <MetricCard label="Expired listings" value={parsedMetrics.data.expiredListings} />
                <MetricCard label="Customer contacts" value={parsedMetrics.data.customerContacts} />
                <MetricCard label="Phone contacts" value={parsedMetrics.data.phoneContacts} />
                <MetricCard label="WhatsApp contacts" value={parsedMetrics.data.whatsappContacts} />
                <MetricCard label="Notify-me requests" value={parsedMetrics.data.notifyRequests} />
                <MetricCard
                  label="Reported money saved"
                  value={formatINR(parsedMetrics.data.reportedMoneySaved)}
                  detail="Optional amount reported by your shop; not independently verified."
                />
              </ul>
              <p className="mt-3 text-xs text-slate-600">
                Customer contacts count clicks on phone or WhatsApp contact links. Sold-out counts listings marked sold by your shop.
              </p>
            </>
          ) : (
            <p role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              Metrics are temporarily unavailable. Your shop and listings are unaffected.
            </p>
          )}
          <Link
            href="/dashboard/listings"
            className="mt-5 inline-flex min-h-11 items-center rounded-full border border-emerald-900/20 px-5 text-sm font-semibold text-emerald-950 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            Manage listings
          </Link>
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

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
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

function DashboardNotConfigured() {
  return (
    <DashboardMessage
      title="Dashboard is not configured"
      description="Supabase authentication is not configured for this environment."
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
