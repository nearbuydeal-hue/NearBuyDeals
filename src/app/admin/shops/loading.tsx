export default function AdminShopsLoading() {
  return (
    <main
      id="main-content"
      aria-busy="true"
      className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-emerald-800">Loading shop review…</p>
        <div className="mt-6 h-44 animate-pulse rounded-3xl bg-white" />
      </div>
    </main>
  );
}
