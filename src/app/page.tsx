import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Search nearby",
    description:
      "Search by product and area to discover what local shops have available.",
  },
  {
    number: "02",
    title: "Explore local shops",
    description:
      "Browse availability shared by shops in your neighbourhood.",
  },
  {
    number: "03",
    title: "Contact the shop",
    description:
      "Reach out to a shop directly to ask about an item before you visit.",
  },
];

export default function Home() {
  return (
    <main id="main-content" className="flex-1">
      <section
        aria-labelledby="hero-title"
        className="border-b border-emerald-950/10 bg-[#f5f7ef]"
      >
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:py-28">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-white/70 px-3 py-1.5 text-sm font-medium text-emerald-900">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-emerald-600"
              />
              Your neighbourhood, a little closer
            </p>
            <h1
              id="hero-title"
              className="max-w-xl text-4xl font-semibold tracking-tight text-emerald-950 sm:text-5xl sm:leading-[1.12]"
            >
              Find available products from local shops near you.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Discover what nearby shops have available, then contact them
              directly.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-800 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
            >
              List your shop
            </Link>
          </div>

          <div
            aria-label="Search preview"
            className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(6,78,59,0.4)] sm:p-7"
          >
            <div className="mb-6">
              <p className="text-sm font-semibold text-emerald-800">
                NEARBYDEALS
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-emerald-950">
                What are you looking for?
              </h2>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Product
                <input
                  type="search"
                  placeholder="e.g. Search by item name"
                  disabled
                  className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 placeholder:text-slate-400 disabled:cursor-not-allowed"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Area
                <input
                  type="text"
                  placeholder="e.g. Your neighbourhood"
                  disabled
                  className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 placeholder:text-slate-400 disabled:cursor-not-allowed"
                />
              </label>
              <button
                type="button"
                disabled
                className="min-h-12 cursor-not-allowed rounded-xl bg-emerald-800 px-5 text-base font-semibold text-white/80"
              >
                Search coming soon
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Search is not available yet. We&apos;re preparing the beta.
            </p>
          </div>
        </div>
      </section>

      <section
        id="search"
        aria-labelledby="shops-title"
        className="mx-auto max-w-6xl scroll-mt-8 px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Made for nearby
          </p>
          <h2
            id="shops-title"
            className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl"
          >
            Browse nearby shops
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            This space will help you discover local shops and the products
            they choose to share.
          </p>
        </div>
        <div className="mt-8 rounded-2xl border border-dashed border-emerald-900/20 bg-[#f8f9f5] px-5 py-8 sm:px-8 sm:py-10">
          <p className="font-medium text-emerald-950">
            Shop listings will appear here when the beta is ready.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            No shop listings are available yet.
          </p>
        </div>
      </section>

      <section
        id="how-it-works"
        aria-labelledby="how-it-works-title"
        className="border-y border-emerald-950/10 bg-[#f5f7ef]"
      >
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Simple by design
          </p>
          <h2
            id="how-it-works-title"
            className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl"
          >
            How it works
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-emerald-950/10 bg-white p-5 sm:p-6"
              >
                <p className="text-sm font-semibold text-emerald-700">
                  {step.number}
                </p>
                <h3 className="mt-4 text-lg font-semibold text-emerald-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
