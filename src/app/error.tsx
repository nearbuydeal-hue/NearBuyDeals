"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (error.digest) {
      console.error("Application route failed. Error digest:", error.digest);
    } else {
      console.error("Application route failed.");
    }
  }, [error.digest]);

  return (
    <main
      id="main-content"
      className="flex flex-1 items-center bg-[#f5f7ef] px-5 py-16 sm:px-8"
    >
      <section className="mx-auto w-full max-w-xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-emerald-950">
          Something went wrong
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          We couldn’t load this page. Try again, or return later if the problem
          continues.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
