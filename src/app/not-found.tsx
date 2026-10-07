import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex flex-1 items-center bg-[#f5f7ef] px-5 py-16 sm:px-8"
    >
      <section className="mx-auto w-full max-w-xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Page not found
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950">
          We couldn’t find that page
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Check the address or return to the NearbyDeals home page.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          Go to home
        </Link>
      </section>
    </main>
  );
}
