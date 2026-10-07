export default function AdminMetricsLoading() {
  return (
    <main
      id="main-content"
      aria-busy="true"
      className="flex-1 bg-[#f5f7ef] px-5 py-10 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium text-emerald-800">
          Loading business metrics…
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
