export default function Loading() {
  return (
    <main
      id="main-content"
      aria-busy="true"
      className="flex flex-1 items-start bg-[#f5f7ef] px-5 py-12 sm:px-8"
    >
      <div className="mx-auto w-full max-w-5xl">
        <p className="text-sm font-medium text-emerald-800">Loading…</p>
        <div className="mt-5 h-36 animate-pulse rounded-3xl bg-white" />
      </div>
    </main>
  );
}
