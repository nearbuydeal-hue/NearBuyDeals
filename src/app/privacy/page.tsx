import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | NearbyDeals",
  description:
    "Learn what information NearbyDeals collects for local shop discovery and how it is used.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | NearbyDeals",
    description:
      "Learn what information NearbyDeals collects for local shop discovery and how it is used.",
  },
};

const sections = [
  {
    title: "Who operates NearbyDeals",
    content: (
      <p>
        NearbyDeals is operated by <strong>[LEGAL BUSINESS NAME — FOUNDER TO SUPPLY]</strong>.
        This document is a product information draft, not legal advice. Before
        launch, provide the legal operator name, the effective date, a contact
        email, and any business address required in the relevant location.
      </p>
    ),
  },
  {
    title: "Information collected",
    content: (
      <>
        <p>Depending on how you use the service, we may store:</p>
        <ul>
          <li>
            <strong>Shop-owner account details:</strong> name, email address,
            phone number, and authentication/session information handled by
            Supabase Auth.
          </li>
          <li>
            <strong>Shop details:</strong> shop name, type, description,
            telephone and WhatsApp numbers, address, area, city, and approval
            status.
          </li>
          <li>
            <strong>Listings:</strong> item name, description, category,
            quantity, unit, optional displayed price where allowed, expiry
            date, listing status, and optional shop-reported savings.
          </li>
          <li>
            <strong>Notify-me requests:</strong> the listing reference, chosen
            contact method, contact value, request status, and timestamps.
            Requests do not cause an email, SMS, or WhatsApp message to be sent
            automatically.
          </li>
          <li>
            <strong>Contact interactions:</strong> shop/listing reference,
            whether the phone or WhatsApp link was clicked, and event time.
            These events do not identify the customer and a click does not prove
            a call or conversation took place.
          </li>
          <li>
            <strong>Search activity:</strong> when a customer submits a search
            with an item or area, we store only its timestamp for aggregate
            beta metrics. The item and area entered are not stored as search
            history.
          </li>
          <li>
            <strong>Technical request data:</strong> the hosting or security
            provider may process connection details such as an IP address in
            operational logs. The application does not store IP addresses in
            its marketplace tables.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "How information is used",
    content: (
      <p>
        Information is used to create and secure shop-owner accounts, review
        shop submissions, display approved shop availability, record customer
        contact intent and notify-me requests, calculate aggregate product
        metrics, prevent misuse, and operate and troubleshoot the service.
        Notify-me contact values are stored so an authorized operator may
        review requests; automated notification delivery is not implemented.
      </p>
    ),
  },
  {
    title: "Public and restricted information",
    content: (
      <p>
        Approved shop and active listing details are intended to be visible to
        the public. Shop-owner account data is restricted to authenticated
        account operations and authorized administration. Notify-me contact
        values and internal metrics are not part of public listings and are
        restricted by database access policies. Do not submit information you
        do not want stored for these purposes.
      </p>
    ),
  },
  {
    title: "Cookies and local storage",
    content: (
      <p>
        The application uses authentication session cookies through Supabase
        Auth to support sign-in and protected account areas. The application
        does not intentionally use browser local storage for analytics or
        advertising. Hosting and authentication providers may use their own
        strictly necessary technologies; review their notices for details.
      </p>
    ),
  },
  {
    title: "Service providers",
    content: (
      <p>
        The application uses Supabase for database and authentication services.
        Vercel is the intended application hosting and scheduled-job provider
        when deployed there. Google sign-in may be available through Supabase
        Auth if the operator enables the Google provider. No third-party
        analytics or notification-delivery provider is intentionally integrated
        in this application. Provider configurations may change and should be
        rechecked before launch.
      </p>
    ),
  },
  {
    title: "Retention and security",
    content: (
      <p>
        A complete retention schedule has not yet been set. The operator must
        establish and publish retention periods for account, shop, listing,
        contact-event, and notify-me data before production use. The
        application uses Supabase access controls and row-level security for
        database operations, and keeps privileged credentials server-side.
        These measures reduce risk but cannot guarantee that data will never
        be accessed, lost, or disclosed improperly.
      </p>
    ),
  },
  {
    title: "Your requests",
    content: (
      <p>
        To ask about access, correction, or deletion of information, contact
        <strong> [CONTACT EMAIL — FOUNDER TO SUPPLY]</strong>. Requests will be
        handled subject to identity checks, applicable law, and records that
        must be retained. Add any legally required process, response periods,
        and complaint contact after qualified legal review.
      </p>
    ),
  },
  {
    title: "Contact and effective date",
    id: "contact",
    content: (
      <p>
        Effective date: <strong>[EFFECTIVE DATE — FOUNDER TO SUPPLY]</strong>.
        Operator: <strong>[LEGAL BUSINESS NAME — FOUNDER TO SUPPLY]</strong>.
        Contact: <strong>[CONTACT EMAIL — FOUNDER TO SUPPLY]</strong>. Business
        address, if required:{" "}
        <strong>[BUSINESS ADDRESS — FOUNDER TO SUPPLY]</strong>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Draft for product transparency. This is not legal advice or a
          compliance certification. Fill in all marked operator details and
          obtain qualified privacy/legal review before the pilot.
        </p>
        <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
          {sections.map((section) => (
            <section
              key={section.title}
              id={"id" in section ? section.id : undefined}
              aria-labelledby={`privacy-${section.title}`}
            >
              <h2
                id={`privacy-${section.title}`}
                className="text-xl font-semibold tracking-tight text-emerald-950"
              >
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
                {section.content}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-9 border-t border-slate-100 pt-5 text-sm text-slate-600">
          Read the <Link href="/terms" className="font-semibold text-emerald-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Terms of Use</Link>.
        </p>
      </article>
    </main>
  );
}
