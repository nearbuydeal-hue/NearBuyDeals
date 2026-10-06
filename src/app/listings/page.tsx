import Link from "next/link";
import { NotifyAvailabilityForm } from "@/components/listings/NotifyAvailabilityForm";
import {
  createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  if (!hasSupabaseServerConfig()) {
    return (
      <main id="main-content" className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-emerald-950">Listings are temporarily unavailable</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Please try again in a moment.</p>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: listings, error } = await supabase
    .from("listings")
    .select(
      "id, item_name, description, category, quantity, unit, price, expiry_date, status, created_at, shop_id",
    )
    .in("status", ["active", "sold_out"])
    .or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString().slice(0, 10)}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Public listings query failed:", error.code);
    return (
      <main id="main-content" className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-emerald-950">Listings are temporarily unavailable</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Please try again in a moment.</p>
        </div>
      </main>
    );
  }

  const shopIds = [...new Set((listings ?? []).map((listing) => listing.shop_id))];
  const { data: shops, error: shopsError } = shopIds.length
    ? await supabase
        .from("shops")
        .select(
          "id, name, shop_type, phone, whatsapp, address, area, city, approval_status",
        )
        .in("id", shopIds)
        .eq("approval_status", "approved")
    : { data: [], error: null };

  if (shopsError) {
    console.error("Approved shops lookup failed:", shopsError.code);
    return (
      <main id="main-content" className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-emerald-950">Listings are temporarily unavailable</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Please try again in a moment.</p>
        </div>
      </main>
    );
  }

  const approvedShopMap = new Map(
    ((shops ?? []) as Array<{
      id: string;
      name: string;
      shop_type: string;
      phone: string;
      whatsapp: string | null;
      address: string;
      area: string;
      city: string;
      approval_status: string;
    }>).map((shop) => [shop.id, shop]),
  );

  const approvedListings = (listings ?? []).filter((listing) =>
    approvedShopMap.has(listing.shop_id),
  );
  const activeListings = approvedListings.filter(
    (listing) => listing.status === "active",
  );
  const unavailableListings = approvedListings.filter(
    (listing) => listing.status === "sold_out",
  );

  return (
    <main id="main-content" className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Discover nearby</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">Available listings</h1>
          </div>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-emerald-900/20 px-5 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Back home</Link>
        </div>

        {activeListings.length > 0 ? (
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {activeListings.map((listing) => {
              const shop = approvedShopMap.get(listing.shop_id);

              if (!shop) {
                return null;
              }

              return (
                <li key={listing.id} className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-emerald-800">{shop.name}</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-emerald-950">{listing.item_name}</h2>
                    </div>
                    <span className="inline-flex rounded-full border border-emerald-900/15 bg-emerald-50 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-emerald-800">Active</span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                    {listing.category ? <p><span className="font-medium text-slate-900">Category:</span> {listing.category}</p> : null}
                    <p><span className="font-medium text-slate-900">Available:</span> {listing.quantity} {listing.unit}</p>
                    {listing.price !== null && listing.price !== undefined ? <p><span className="font-medium text-slate-900">Price:</span> {Number(listing.price).toFixed(2)}</p> : null}
                    {listing.expiry_date ? <p><span className="font-medium text-slate-900">Expiry:</span> {new Date(listing.expiry_date).toLocaleDateString()}</p> : null}
                    {listing.description ? <p>{listing.description}</p> : null}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-900">{shop.address}</p>
                    <p>{shop.area}, {shop.city}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <a href={`tel:${shop.phone}`} className="inline-flex min-h-11 items-center rounded-full border border-emerald-900/20 px-4 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Call shop</a>
                      {shop.whatsapp ? (
                        <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">WhatsApp</a>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        {unavailableListings.length > 0 ? (
          <section aria-labelledby="unavailable-heading" className="mt-10">
            <h2 id="unavailable-heading" className="text-xl font-semibold tracking-tight text-emerald-950">
              Currently unavailable
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Request availability updates for sold-out items. We do not send notifications yet.
            </p>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {unavailableListings.map((listing) => {
                const shop = approvedShopMap.get(listing.shop_id);

                if (!shop) {
                  return null;
                }

                return (
                  <li key={listing.id} className="rounded-3xl border border-amber-900/10 bg-white p-5 shadow-sm sm:p-6">
                    <p className="text-sm font-medium text-emerald-800">{shop.name}</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-emerald-950">
                      {listing.item_name}
                    </h3>
                    {listing.category ? (
                      <p className="mt-2 text-sm text-slate-600">Category: {listing.category}</p>
                    ) : null}
                    <p className="mt-2 text-sm font-medium text-amber-900">Sold out</p>
                    <NotifyAvailabilityForm listingId={listing.id} />
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {activeListings.length === 0 && unavailableListings.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-emerald-900/20 bg-[#f8f9f5] p-8 text-center text-slate-600">
            No active listings are available right now. Please check back later.
          </div>
        ) : null}
      </div>
    </main>
  );
}
