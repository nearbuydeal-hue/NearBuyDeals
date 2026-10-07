import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | NearbyDeals",
  description:
    "Read the draft terms for using NearbyDeals local shop discovery.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Use | NearbyDeals",
    description:
      "Read the draft terms for using NearbyDeals local shop discovery.",
  },
};

export default function TermsPage() {
  return (
    <main
      id="main-content"
      className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16"
    >
      <article className="mx-auto max-w-3xl rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          NearbyDeals
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
          Terms of Use
        </h1>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Draft product terms only. They are not legal advice and may not be
          legally sufficient. Complete the marked operator details and have a
          qualified lawyer review these terms for the locations where the
          service will operate before launch.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
          <section aria-labelledby="terms-operator">
            <h2 id="terms-operator" className="text-xl font-semibold text-emerald-950">
              Operator and acceptance
            </h2>
            <p className="mt-3">
              NearbyDeals is operated by{" "}
              <strong>[LEGAL BUSINESS NAME — FOUNDER TO SUPPLY]</strong>. By
              accessing or using the service, you agree to these terms as
              finally approved by the operator. Effective date:{" "}
              <strong>[EFFECTIVE DATE — FOUNDER TO SUPPLY]</strong>.
            </p>
          </section>

          <section aria-labelledby="terms-role">
            <h2 id="terms-role" className="text-xl font-semibold text-emerald-950">
              Our role
            </h2>
            <p className="mt-3">
              NearbyDeals is a local discovery platform where participating
              shops can publish information about stock they say is available.
              Shops are responsible for their listings and shop information.
              Customers contact shops directly to confirm details and arrange
              any interaction. NearbyDeals does not take part in or complete
              transactions between a shop and a customer.
            </p>
          </section>

          <section aria-labelledby="terms-no-services">
            <h2 id="terms-no-services" className="text-xl font-semibold text-emerald-950">
              No checkout or delivery
            </h2>
            <p className="mt-3">
              The current version does not process payments, provide checkout,
              or provide delivery. Any price shown is informational and does not
              mean a purchase can be made through NearbyDeals.
            </p>
          </section>

          <section aria-labelledby="terms-availability">
            <h2 id="terms-availability" className="text-xl font-semibold text-emerald-950">
              Availability and shop information
            </h2>
            <p className="mt-3">
              Listings, quantities, prices, contact information, approval
              state, and shop details may be incomplete, inaccurate, or change
              without notice. NearbyDeals does not guarantee stock,
              availability, quality, safety, legality, or suitability. Contact
              the shop directly before relying on a listing or travelling to a
              location.
            </p>
          </section>

          <section aria-labelledby="terms-shop">
            <h2 id="terms-shop" className="text-xl font-semibold text-emerald-950">
              Shop responsibilities
            </h2>
            <p className="mt-3">
              Shop users must provide accurate, lawful, current information;
              maintain access to their account; update or remove listings that
              are no longer accurate; and ensure they have the rights and
              permissions needed to publish submitted material. Shops must
              comply with all laws and rules applicable to their business and
              products.
            </p>
          </section>

          <section aria-labelledby="terms-users">
            <h2 id="terms-users" className="text-xl font-semibold text-emerald-950">
              Account responsibilities
            </h2>
            <p className="mt-3">
              Shop owners are responsible for keeping account credentials
              private and for activity conducted through their account. Notify
              the operator promptly if you believe an account has been
              compromised. Do not share credentials or attempt to access
              another person’s account.
            </p>
          </section>

          <section aria-labelledby="terms-prohibited">
            <h2 id="terms-prohibited" className="text-xl font-semibold text-emerald-950">
              Prohibited use
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Do not submit false, misleading, unlawful, or infringing content.</li>
              <li>Do not scrape, overload, probe, or disrupt the service.</li>
              <li>Do not attempt to bypass access controls or moderation.</li>
              <li>Do not misuse contact or notify-me information.</li>
              <li>Do not use the service to facilitate unlawful transactions.</li>
            </ul>
          </section>

          <section aria-labelledby="terms-pharmacy">
            <h2 id="terms-pharmacy" className="text-xl font-semibold text-emerald-950">
              Restricted product categories
            </h2>
            <p className="mt-3">
              Pharmacy availability features are limited and require local
              regulatory and legal review before use. The current product does
              not provide medicine sales, medicine payments, medicine
              delivery, or prescription processing. Do not treat listing or
              approval as a regulatory authorization.
            </p>
          </section>

          <section aria-labelledby="terms-enforcement">
            <h2 id="terms-enforcement" className="text-xl font-semibold text-emerald-950">
              Moderation, suspension, and removal
            </h2>
            <p className="mt-3">
              The operator may review, hide, reject, suspend, or remove a shop,
              listing, or account where needed to operate the service, respond
              to a safety or legal concern, enforce these terms, or protect
              users. Any final notice, appeal process, and applicable rights
              must be settled with legal review before production.
            </p>
          </section>

          <section aria-labelledby="terms-liability">
            <h2 id="terms-liability" className="text-xl font-semibold text-emerald-950">
              Liability language requires legal review
            </h2>
            <p className="mt-3">
              The service is provided during a beta and may be interrupted or
              contain errors. This draft does not attempt to limit liability or
              waive consumer rights. Any limitation of liability, warranty
              disclaimer, indemnity, dispute, governing-law, and consumer-rights
              language must be drafted or approved by a qualified lawyer for
              the applicable jurisdiction.
            </p>
          </section>

          <section aria-labelledby="terms-contact">
            <h2 id="terms-contact" className="text-xl font-semibold text-emerald-950">
              Contact
            </h2>
            <p className="mt-3">
              Operator: <strong>[LEGAL BUSINESS NAME — FOUNDER TO SUPPLY]</strong>.
              Contact email: <strong>[CONTACT EMAIL — FOUNDER TO SUPPLY]</strong>.
              Address, if required:{" "}
              <strong>[BUSINESS ADDRESS — FOUNDER TO SUPPLY]</strong>.
            </p>
          </section>
        </div>
        <p className="mt-9 border-t border-slate-100 pt-5 text-sm text-slate-600">
          Read the <Link href="/privacy" className="font-semibold text-emerald-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Privacy Policy</Link>.
        </p>
      </article>
    </main>
  );
}
