import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/metrics/MetricCard";
import {
  createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "@/lib/supabase/server";
import {
  adminMetricsSchema,
  metricsPeriodSchema,
  type MetricsPeriod,
} from "@/lib/validation/metrics";

export const metadata: Metadata = {
  title: "Business metrics | NearbyDeals",
  description: "Review aggregate marketplace activity metrics.",
  robots: { index: false, follow: false },
};

type AdminMetricsPageProps = {
  searchParams: Promise<{ period?: string }>;
};

const shopTypes = [
  { key: "pharmacy", label: "Pharmacy" },
  { key: "grocery", label: "Grocery" },
  { key: "restaurant", label: "Restaurant" },
] as const;

export default async function AdminMetricsPage({
  searchParams,
}: AdminMetricsPageProps) {
  const params = await searchParams;
  const periodResult = metricsPeriodSchema.safeParse(params.period);
  const period: MetricsPeriod = periodResult.success ? periodResult.data : "all";

  if (!hasSupabaseServerConfig()) {
    return <MetricsUnavailable />;
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
    console.error("Admin metrics role lookup failed:", profileError.code);
    return <MetricsUnavailable />;
  }

  if (profile?.role !== "admin") {
    return <Unauthorized />;
  }

  const { data: rawMetrics, error: metricsError } = await supabase.rpc(
    "get_admin_metrics",
    { _period: period },
  );

  if (metricsError) {
    console.error("Admin metrics RPC failed:", metricsError.code);
    return <MetricsUnavailable />;
  }

  const parsedMetrics = adminMetricsSchema.safeParse(rawMetrics);
  if (!parsedMetrics.success) {
    console.error("Admin metrics response had an unexpected shape.");
    return <MetricsUnavailable />;
  }

  const metrics = parsedMetrics.data;

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
              Administration
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
              Business metrics
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Aggregate activity only. Customer contact values are not included.
            </p>
          </div>
          <Link
            href="/admin/shops"
            className="inline-flex min-h-11 items-center rounded-full border border-emerald-900/20 px-5 text-sm font-semibold text-emerald-950 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            Shop approvals
          </Link>
        </div>

        <form className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-950/10 bg-white p-4">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
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
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            Apply
          </button>
        </form>

        <MetricSection title="Shops">
          <MetricCard label="Total shops" value={metrics.shops.total} />
          <MetricCard label="Pending" value={metrics.shops.pending} />
          <MetricCard label="Approved" value={metrics.shops.approved} />
          <MetricCard label="Rejected" value={metrics.shops.rejected} />
          <MetricCard label="Suspended" value={metrics.shops.suspended} />
        </MetricSection>

        <MetricSection title="Listings">
          <MetricCard label="Total listings" value={metrics.listings.total} />
          <MetricCard label="Active" value={metrics.listings.active} />
          <MetricCard label="Sold out" value={metrics.listings.soldOut} />
          <MetricCard label="Expired" value={metrics.listings.expired} />
          <MetricCard label="Removed" value={metrics.listings.removed} />
        </MetricSection>

        <MetricSection title="Customer demand">
          <MetricCard
            label="Total contacts"
            value={metrics.customerDemand.totalContacts}
            detail="Recorded clicks on phone or WhatsApp contact links."
          />
          <MetricCard
            label="Phone contacts"
            value={metrics.customerDemand.phoneContacts}
          />
          <MetricCard
            label="WhatsApp contacts"
            value={metrics.customerDemand.whatsappContacts}
          />
          <MetricCard
            label="Notify-me requests"
            value={metrics.customerDemand.notifyRequests}
          />
        </MetricSection>

        <MetricSection title="Outcomes">
          <MetricCard
            label="Listings marked sold"
            value={metrics.outcomes.listingsMarkedSold}
          />
          <MetricCard
            label="Reported money saved"
            value={formatINR(metrics.outcomes.reportedMoneySaved)}
            detail="Optional amounts reported by shops; not independently verified."
          />
        </MetricSection>

        <section
          aria-labelledby="shop-type-heading"
          className="mt-9 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"
        >
          <h2
            id="shop-type-heading"
            className="text-xl font-semibold tracking-tight text-emerald-950"
          >
            Usage by shop type
          </h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {shopTypes.map(({ key, label }) => {
              const typeMetrics = metrics.byShopType[key];
              return (
                <article
                  key={key}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
                >
                  <h3 className="text-lg font-semibold text-emerald-950">
                    {label}
                  </h3>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <Breakdown label="Shops" value={typeMetrics.shops} />
                    <Breakdown label="Listings" value={typeMetrics.listings} />
                    <Breakdown
                      label="Active"
                      value={typeMetrics.activeListings}
                    />
                    <Breakdown
                      label="Sold out"
                      value={typeMetrics.soldOutListings}
                    />
                    <Breakdown
                      label="Expired"
                      value={typeMetrics.expiredListings}
                    />
                    <Breakdown
                      label="Removed"
                      value={typeMetrics.removedListings}
                    />
                    <Breakdown
                      label="Phone contacts"
                      value={typeMetrics.phoneContacts}
                    />
                    <Breakdown
                      label="WhatsApp contacts"
                      value={typeMetrics.whatsappContacts}
                    />
                    <Breakdown
                      label="Notify requests"
                      value={typeMetrics.notifyRequests}
                    />
                    <Breakdown
                      label="Listings marked sold"
                      value={typeMetrics.listingsMarkedSold}
                    />
                    <Breakdown
                      label="Reported savings"
                      value={formatINR(typeMetrics.reportedMoneySaved)}
                    />
                  </dl>
                </article>
              );
            })}
          </div>
        </section>
        <p className="mt-4 text-xs leading-5 text-slate-600">
          Listing status totals reflect current status for listings created in
          the selected period. Sold outcomes use the recorded sold-out date.
        </p>
      </div>
    </main>
  );
}

function MetricSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8" aria-label={title}>
      <h2 className="mb-3 text-lg font-semibold text-emerald-950">{title}</h2>
      <ul className="grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {children}
      </ul>
    </section>
  );
}

function Breakdown({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function Unauthorized() {
  return (
    <main
      id="main-content"
      className="flex-1 bg-[#f5f7ef] px-5 py-16 sm:px-8"
    >
      <section className="mx-auto max-w-xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-emerald-950">
          Access unavailable
        </h1>
        <p className="mt-3 text-slate-600">
          This page is not available for your account.
        </p>
      </section>
    </main>
  );
}

function MetricsUnavailable() {
  return (
    <main
      id="main-content"
      className="flex-1 bg-[#f5f7ef] px-5 py-16 sm:px-8"
    >
      <section className="mx-auto max-w-xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-emerald-950">
          Metrics are temporarily unavailable
        </h1>
        <p className="mt-3 text-slate-600">
          Please try again later.
        </p>
      </section>
    </main>
  );
}
