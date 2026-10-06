import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Shop owner sign up | NearbyDeals",
  description: "Create a NearbyDeals shop-owner account for the free beta.",
};

type SignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-emerald-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          Back to NearbyDeals
        </Link>
        <div className="mt-5 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Free beta
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
            Sign up your shop
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Create your account and submit your shop for admin review. Shops
            remain pending until approved.
          </p>
          {params.error === "setup" ? (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              We couldn’t finish setting up your shop. Log in or contact
              support for help.
            </p>
          ) : params.error === "oauth" ? (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              Google sign-in failed. Check that Google is enabled in Supabase
              and try again.
            </p>
          ) : null}
          <div className="mt-7">
            <SignupForm />
          </div>
        </div>
      </div>
    </main>
  );
}
