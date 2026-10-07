import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "@/lib/supabase/server";
import {
  createListingAction,
  removeListingAction,
  updateListingAction,
} from "@/app/actions/listings";

const inputClassName =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800";
const labelClassName = "grid gap-2 text-sm font-medium text-slate-700";

const listingStatusLabels = {
  active: "Active",
  sold_out: "Sold out",
  expired: "Expired",
  removed: "Removed",
} as const;

const listingStatusStyles = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-900",
  sold_out: "border-amber-200 bg-amber-50 text-amber-900",
  expired: "border-slate-300 bg-slate-100 text-slate-800",
  removed: "border-red-200 bg-red-50 text-red-900",
} as const;

export default async function DashboardListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  if (!hasSupabaseServerConfig()) {
    return <ListingsUnavailable title="Listing tools are not configured" description="Supabase is not configured for this environment." />;
  }

  const params = await searchParams;
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
    console.error("Listing page profile query failed:", profileError.code);
    return <ListingsUnavailable title="Listing tools are temporarily unavailable" description="We could not verify your account details." />;
  }

  if (profile?.role !== "shop_owner") {
    return <ListingsUnavailable title="Shop-owner access required" description="Only shop owners can manage listings." />;
  }

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id, name, approval_status")
    .eq("owner_id", authData.user.id)
    .maybeSingle();

  if (shopError) {
    console.error("Listing page shop lookup failed:", shopError.code);
    return <ListingsUnavailable title="Listing tools are temporarily unavailable" description="We could not load your shop details." />;
  }

  if (!shop) {
    return <ListingsUnavailable title="Shop not found" description="Create a shop before managing listings." />;
  }

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("id, item_name, description, category, quantity, unit, price, expiry_date, status, created_at, sold_out_at, reported_money_saved")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  if (listingsError) {
    console.error("Listing query failed:", listingsError.code);
    return <ListingsUnavailable title="Listing tools are temporarily unavailable" description="We could not load your listings." />;
  }

  const alert =
    params.error === "not-configured"
      ? "Listings are not configured in this environment."
      : params.error === "approval"
        ? "Your shop must be approved before you can add listings."
        : params.error === "save"
          ? "We could not save the listing. Check the details and try again."
          : params.error === "invalid"
            ? "Review the listing details and try again."
            : params.error === "shop-owner"
              ? "Only shop owners can manage listings."
              : params.error === "no-shop"
                ? "Create a shop before managing listings."
                : params.error === "missing"
                  ? "The listing could not be identified."
                  : params.error === "access"
                    ? "You do not have access to that listing."
                    : undefined;

  const success =
    params.success === "created"
      ? "Listing created."
      : params.success === "updated"
        ? "Listing updated."
        : params.success === "removed"
          ? "Listing removed."
          : undefined;

  return (
    <main id="main-content" className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Shop listings</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">Manage listings</h1>
          </div>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-full border border-emerald-900/20 px-5 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Back to dashboard</Link>
        </div>

        <section className="mt-8 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-emerald-950">{shop.name}</h2>
              <p className="mt-1 text-sm text-slate-600">Approval status: <span className="font-medium text-slate-900">{shop.approval_status}</span></p>
            </div>
          </div>

          {alert ? (
            <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{alert}</p>
          ) : null}
          {success ? (
            <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</p>
          ) : null}

          <form action={createListingAction} className="mt-6 grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={`${labelClassName} sm:col-span-2`}>
                Item name
                <input className={inputClassName} name="itemName" type="text" maxLength={160} required />
              </label>
              <label className={labelClassName}>
                Quantity
                <input className={inputClassName} name="quantity" type="number" min="0.001" step="0.001" required />
              </label>
              <label className={labelClassName}>
                Unit
                <input className={inputClassName} name="unit" type="text" maxLength={32} placeholder="boxes, kg, packs" required />
              </label>
              <label className={labelClassName}>
                Category
                <input className={inputClassName} name="category" type="text" maxLength={80} placeholder="Optional" />
              </label>
              <label className={labelClassName}>
                Price
                <input className={inputClassName} name="price" type="number" min="0" step="0.01" placeholder="Optional" />
              </label>
              <label className={labelClassName}>
                Expiry date
                <input className={inputClassName} name="expiryDate" type="date" />
              </label>
              <label className={`${labelClassName} sm:col-span-2`}>
                Description
                <textarea className={`${inputClassName} min-h-28 resize-y`} name="description" maxLength={2000} placeholder="Optional" />
              </label>
            </div>
            <button type="submit" className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-800 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800">Add listing</button>
          </form>
        </section>

        <section className="mt-8 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-emerald-950">Current listings</h2>
          {listings && listings.length > 0 ? (
            <ul className="mt-5 grid gap-4">
              {listings.map((listing) => {
                const expiryHasPassed =
                  listing.expiry_date !== null &&
                  listing.expiry_date < new Date().toISOString().slice(0, 10);
                const displayStatus =
                  expiryHasPassed &&
                  (listing.status === "active" || listing.status === "sold_out")
                    ? "expired"
                    : listing.status;

                return (
                  <li key={listing.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-emerald-950">{listing.item_name}</h3>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${listingStatusStyles[displayStatus]}`}>{listingStatusLabels[displayStatus]}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{listing.quantity} {listing.unit}</p>
                        {listing.category ? <p className="mt-1 text-sm text-slate-600">Category: {listing.category}</p> : null}
                        {listing.description ? <p className="mt-2 text-sm leading-6 text-slate-700">{listing.description}</p> : null}
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                          {listing.price !== null && listing.price !== undefined ? <span>Price: {Number(listing.price).toFixed(2)}</span> : null}
                          {listing.expiry_date ? <span>Expiry: {new Date(listing.expiry_date).toLocaleDateString()}</span> : null}
                          {listing.reported_money_saved !== null ? <span>Reported savings: {Number(listing.reported_money_saved).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</span> : null}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:min-w-40">
                        <form action={updateListingAction} className="grid gap-2">
                          <input type="hidden" name="listingId" value={listing.id} />
                          <label className="grid gap-2 text-sm font-medium text-slate-700">
                            Status
                            <select className={inputClassName} name="status" defaultValue={displayStatus}>
                              <option value="active" disabled={expiryHasPassed}>Active</option>
                              <option value="sold_out" disabled={expiryHasPassed}>Sold out</option>
                              <option value="expired">Expired</option>
                              <option value="removed">Removed</option>
                            </select>
                          </label>
                          <label className="grid gap-2 text-sm font-medium text-slate-700">
                            Reported money saved (INR, optional)
                            <input
                              className={inputClassName}
                              name="reportedMoneySaved"
                              type="number"
                              min="0"
                              max="9999999999.99"
                              step="0.01"
                              defaultValue={displayStatus === "sold_out" ? listing.reported_money_saved ?? "" : ""}
                              placeholder="Only when marking sold out"
                            />
                          </label>
                          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-900/20 px-4 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Save status</button>
                        </form>

                        <form action={removeListingAction}>
                          <input type="hidden" name="listingId" value={listing.id} />
                          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-800 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">Remove</button>
                        </form>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-emerald-900/20 bg-[#f8f9f5] px-5 py-8 text-sm text-slate-600">
              No listings yet. Add the first item for your shop.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ListingsUnavailable({ title, description }: { title: string; description: string }) {
  return (
    <main id="main-content" className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-emerald-950">{title}</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
        <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center rounded-full border border-emerald-900/20 px-5 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Back to dashboard</Link>
      </div>
    </main>
  );
}
