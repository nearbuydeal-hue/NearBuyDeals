import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "NearbyDeals — Find Products Near You",
  description:
    "Find available products from local shops near you and contact the shop directly.",
};

const footerLinks = [
  { label: "Privacy", id: "privacy-coming-soon" },
  { label: "Terms", id: "terms-coming-soon" },
  { label: "Contact", id: "contact-coming-soon" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-white px-4 py-3 text-emerald-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-2 focus:outline-offset-2 focus:outline-emerald-800"
        >
          Skip to content
        </a>
        <header className="border-b border-emerald-950/10 bg-white">
          <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
            <Link
              href="/"
              aria-label="NearbyDeals home"
              className="inline-flex min-h-12 items-center gap-2 rounded-md text-lg font-bold tracking-tight text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
            >
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-xl bg-emerald-800 text-sm text-white"
              >
                n
              </span>
              nearbydeals
            </Link>
            <nav aria-label="Main navigation">
              <ul className="flex items-center gap-1 sm:gap-3">
                <li>
                  <Link
                    href="/#search"
                    className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:inline-flex"
                  >
                    Nearby shops
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#how-it-works"
                    className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:inline-flex"
                  >
                    How it works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:px-3"
                  >
                    Log in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:px-3"
                  >
                    For shops
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        {children}
        <footer className="bg-emerald-950 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-md text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              nearbydeals
            </Link>
            <nav aria-label="Footer navigation">
              <ul className="flex flex-wrap gap-x-2 gap-y-1">
                {footerLinks.map((link) => (
                  <li key={link.id}>
                    <a
                      id={link.id}
                      href={`#${link.id}`}
                      className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-emerald-100 underline decoration-emerald-400/60 underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {link.label} (coming soon)
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="text-sm text-emerald-100">
              Month 1 beta preparation
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
