import Link from "next/link";
import type { Metadata } from "next";
import { searchListingsAction } from "@/app/actions/public-search";
import { NotifyAvailabilityForm } from "@/components/listings/NotifyAvailabilityForm";
import { TrackedContactLinks } from "@/components/listings/TrackedContactLinks";
import {
  createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import {
  publicSearchPageSchema,
  publicSearchSchema,
  type PublicSearchParams,
} from "@/lib/validation/public-search";

export const dynamic = "force-dynamic";
const pageSize = 24;
type PublicListing = Pick<
  Database["public"]["Tables"]["listings"]["Row"],
  | "id"
  | "item_name"
  | "description"
  | "category"
  | "quantity"
  | "unit"
  | "price"
  | "expiry_date"
  | "status"
  | "created_at"
  | "shop_id"
>;

export const metadata: Metadata = {
  title: "Available local shop listings | NearbyDeals",
  description:
    "Browse availability information shared by local shops and contact them directly.",
  alternates: { canonical: "/listings" },
  openGraph: {
    title: "Available local shop listings | NearbyDeals",
    description:
      "Browse availability information shared by local shops and contact them directly.",
  },
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}) {
  const rawParams = await searchParams;
  const parsedSearch = publicSearchSchema.safeParse({
    q: typeof rawParams.q === "string" ? rawParams.q : undefined,
    area: typeof rawParams.area === "string" ? rawParams.area : undefined,
  });
  const search: PublicSearchParams = parsedSearch.success
    ? parsedSearch.data
    : { q: undefined, area: undefined };
  const parsedPage = publicSearchPageSchema.safeParse(
    typeof rawParams.page === "string" ? rawParams.page : 1,
  );
  const page = parsedPage.success ? parsedPage.data : 1;
  const invalidSearch = !parsedSearch.success || !parsedPage.success;
  const searchError = rawParams.error === "search";

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
  let matchingShopIds: string[] | undefined;
  let shopLookupError: string | undefined;
  if (search.area && !invalidSearch) {
    matchingShopIds = [];
    const batchSize = 500;
    for (let offset = 0; ; offset += batchSize) {
      const { data, error } = await supabase
        .from("shops")
        .select("id")
        .ilike("area", `%${search.area}%`)
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error("Public area search failed:", error.code);
        shopLookupError = error.code;
        break;
      }

      matchingShopIds.push(...(data ?? []).map((shop) => shop.id));
      if (!data || data.length < batchSize) break;
    }
  }

  let listings: PublicListing[] = [];
  let listingCount = 0;
  let listingsError: string | null = null;
  if (!invalidSearch && !shopLookupError && matchingShopIds?.length !== 0) {
    let query = supabase
      .from("listings")
      .select(
        "id, item_name, description, category, quantity, unit, price, expiry_date, status, created_at, shop_id",
        { count: "exact" },
      )
      .in("status", ["active", "sold_out"])
      .or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString().slice(0, 10)}`);

    if (search.q) {
      query = query.ilike("item_name", `%${search.q}%`);
    }
    if (matchingShopIds) {
      query = query.in("shop_id", matchingShopIds);
    }

    const result = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    listings = result.data ?? [];
    listingCount = result.count ?? 0;
    listingsError = result.error?.code ?? null;
  }

  if (shopLookupError || listingsError) {
    console.error(
      "Public listings query failed:",
      shopLookupError ?? listingsError,
    );
    return (
      <main id="main-content" className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-emerald-950">Listings are temporarily unavailable</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Please try again in a moment.</p>
        </div>
      </main>
    );
  }

  const shopIds = [...new Set(listings.map((listing) => listing.shop_id))];
  const { data: shops, error: shopsError } = shopIds.length
    ? await supabase
        .from("shops")
        .select(
          "id, name, shop_type, phone, whatsapp, address, area, city",
        )
        .in("id", shopIds)
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

  const approvedShopMap = new Map((shops ?? []).map((shop) => [shop.id, shop]));

  const approvedListings = listings.filter((listing) =>
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

        <form
          action={searchListingsAction}
          className="mt-6 grid gap-4 rounded-2xl border border-emerald-950/10 bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Product
            <input
              type="search"
              name="q"
              maxLength={80}
              defaultValue={search.q}
              placeholder="Search by item name"
              className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Area
            <input
              type="text"
              name="area"
              maxLength={80}
              defaultValue={search.area}
              placeholder="Search by shop area"
              className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            Search
          </button>
        </form>

        {invalidSearch || searchError ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
          >
            {invalidSearch
              ? "Search terms must be 80 characters or fewer, and the page number must be valid."
              : "We couldn’t record that search. Please try again."}
          </p>
        ) : null}

        {!invalidSearch && listingCount > 0 ? (
          <p className="mt-5 text-sm text-slate-600" role="status">
            {listingCount} {listingCount === 1 ? "listing" : "listings"} found
            {search.q ? ` for “${search.q}”` : ""}
            {search.area ? ` in ${search.area}` : ""}.
          </p>
        ) : null}

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
                    <TrackedContactLinks
                      shopId={shop.id}
                      listingId={listing.id}
                      phone={shop.phone}
                      whatsapp={shop.whatsapp}
                    />
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
            {search.q || search.area
              ? "No matching stock was found. Try another item or area, or browse all listings."
              : "No active listings are available right now. Please check back later."}
          </div>
        ) : null}

        {listingCount > pageSize ? (
          <nav
            aria-label="Listing pages"
            className="mt-8 flex items-center justify-between gap-4"
          >
            {page > 1 ? (
              <Link
                href={buildListingsHref(search.q, search.area, page - 1)}
                rel="prev"
                className="inline-flex min-h-11 items-center rounded-full border border-emerald-900/20 px-4 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            <p className="text-sm text-slate-600">
              Page {page} of {Math.ceil(listingCount / pageSize)}
            </p>
            {page < Math.ceil(listingCount / pageSize) ? (
              <Link
                href={buildListingsHref(search.q, search.area, page + 1)}
                rel="next"
                className="inline-flex min-h-11 items-center rounded-full border border-emerald-900/20 px-4 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              >
                Next
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </main>
  );
}

function buildListingsHref(
  q: string | undefined,
  area: string | undefined,
  page: number,
) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (area) params.set("area", area);
  params.set("page", String(page));
  return `/listings?${params.toString()}`;
}
