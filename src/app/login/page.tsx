import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Shop owner login | NearbyDeals",
  description: "Log in to your NearbyDeals shop-owner account.",
};

type LoginPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const notice =
    params.message === "signed-out"
      ? "You have been signed out."
      : params.message === "confirmation"
        ? "Your email link could not be verified. Request a new confirmation email by signing up again."
        : undefined;
  const error =
    params.error === "shop-owner"
      ? "This account does not have shop-owner access. Sign up as a shop owner to continue."
      : undefined;

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-emerald-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          Back to NearbyDeals
        </Link>
        <div className="mt-5 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Shop owner
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950">
            Log in
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Manage your shop information and check its approval status.
          </p>
          <div className="mt-7">
            <LoginForm notice={notice} />
            {error ? (
              <p
                role="status"
                className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
