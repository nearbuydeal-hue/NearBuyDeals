import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShopActionForm } from "@/components/admin/AdminShopActionForm";
import {
  createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "@/lib/supabase/server";
import {
  shopApprovalFilterSchema,
  type ShopApprovalFilter,
} from "@/lib/validation/admin";

export const metadata: Metadata = {
  title: "Shop approvals | NearbyDeals",
  description: "Review shop applications and approval status.",
  robots: { index: false, follow: false },
};

type ShopsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const statusLabels: Record<ShopApprovalFilter, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

const statusStyles: Record<ShopApprovalFilter, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-900",
  rejected: "border-red-200 bg-red-50 text-red-900",
  suspended: "border-slate-300 bg-slate-100 text-slate-800",
};

export default async function AdminShopsPage({
  searchParams,
}: ShopsPageProps) {
  const params = await searchParams;
  const parsedStatus = shopApprovalFilterSchema.safeParse(params.status);
  const status: ShopApprovalFilter = parsedStatus.success
    ? parsedStatus.data
    : "pending";
  const success = typeof params.success === "string" ? params.success : null;

  if (!hasSupabaseServerConfig()) {
    return <AdminUnavailable />;
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
    console.error("Admin page role lookup failed:", profileError.code);
    return <AdminUnavailable />;
  }

  if (profile?.role !== "admin") {
    return <Unauthorized />;
  }

  const { data: shops, error: shopsError } = await supabase
    .from("shops")
    .select(
      "id, owner_id, name, shop_type, phone, whatsapp, address, area, city, approval_status, created_at",
    )
    .eq("approval_status", status)
    .order("created_at", { ascending: true });

  if (shopsError) {
    console.error("Admin shops query failed:", shopsError.code);
    return <AdminUnavailable />;
  }

  const ownerIds = [...new Set((shops ?? []).map((shop) => shop.owner_id))];
  const { data: owners, error: ownersError } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ownerIds)
    : { data: [], error: null };

  if (ownersError) {
    console.error("Admin shop owner lookup failed:", ownersError.code);
    return <AdminUnavailable />;
  }

  const ownerNames = new Map(
    (owners ?? []).map((owner) => [owner.id, owner.full_name]),
  );

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
              Administration
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
              Shop approvals
            </h1>
          </div>
          <Link
            href="/admin/metrics"
            className="inline-flex min-h-11 items-center rounded-full border border-emerald-900/20 px-5 text-sm font-semibold text-emerald-950 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            Business metrics
          </Link>
        </div>

        <aside
          aria-labelledby="pharmacy-review-heading"
          className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
        >
          <h2 id="pharmacy-review-heading" className="font-semibold">
            Pharmacy listings require local legal review
          </h2>
          <p className="mt-1">
            Approval in NearbyDeals is not regulatory approval. Do not approve
            or treat pharmacy listings as medicine sales, payments, delivery,
            or prescription processing. Obtain qualified local legal and
            regulatory guidance before enabling pharmacy use.
          </p>
        </aside>

        {success && ["approved", "rejected", "suspended"].includes(success) ? (
          <p
            role="status"
            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"
          >
            Shop status updated to {success}.
          </p>
        ) : null}

        <form
          method="get"
          className="mt-7 flex flex-col gap-3 rounded-2xl border border-emerald-950/10 bg-white p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="status"
              className="mb-1.5 block text-sm font-medium text-slate-800"
            >
              Filter shops by status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:max-w-xs"
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            Apply filter
          </button>
        </form>

        {shops?.length ? (
          <ul className="mt-6 space-y-4">
            {shops.map((shop) => (
              <li
                key={shop.id}
                className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-7"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-emerald-950">
                      {shop.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {shop.shop_type.charAt(0).toUpperCase() +
                        shop.shop_type.slice(1)}
                      {ownerNames.get(shop.owner_id)
                        ? ` · Owner: ${ownerNames.get(shop.owner_id)}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`inline-flex min-h-8 items-center self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[shop.approval_status]}`}
                  >
                    {statusLabels[shop.approval_status]}
                  </span>
                </div>

                <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
                  <ShopDetail label="Phone" value={shop.phone} />
                  <ShopDetail
                    label="WhatsApp"
                    value={shop.whatsapp ?? "Not provided"}
                  />
                  <ShopDetail label="Address" value={shop.address} />
                  <ShopDetail
                    label="Area and city"
                    value={`${shop.area}, ${shop.city}`}
                  />
                  <ShopDetail
                    label="Submitted"
                    value={new Date(shop.created_at).toLocaleDateString()}
                  />
                </dl>

                <AdminShopActionForm
                  shopId={shop.id}
                  status={shop.approval_status}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-emerald-900/20 bg-white p-8 text-center text-slate-600">
            No {status} shops to display.
          </p>
        )}
      </div>
    </main>
  );
}

function ShopDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-slate-900">{value}</dd>
    </div>
  );
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

function AdminUnavailable() {
  return (
    <main
      id="main-content"
      className="flex-1 bg-[#f5f7ef] px-5 py-16 sm:px-8"
    >
      <section className="mx-auto max-w-xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-emerald-950">
          Shop review is temporarily unavailable
        </h1>
        <p className="mt-3 text-slate-600">
          Please try again later.
        </p>
      </section>
    </main>
  );
}
