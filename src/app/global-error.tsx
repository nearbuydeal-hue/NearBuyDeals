"use client";

import { useEffect } from "react";
import Link from "next/link";
import "./globals.css";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    if (error.digest) {
      console.error("Root application failure. Error digest:", error.digest);
    } else {
      console.error("Root application failure.");
    }
  }, [error.digest]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#f5f7ef] p-5 text-slate-900">
        <main className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-emerald-950">
            NearbyDeals is temporarily unavailable
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Please try again later.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            Return home
          </Link>
        </main>
      </body>
    </html>
  );
}
