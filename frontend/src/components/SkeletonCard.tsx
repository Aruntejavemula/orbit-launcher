export default function SkeletonCard() {
  return (
    <div
      className="flex flex-col rounded-2xl p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
    >
      <div className="shimmer h-9 w-9 rounded-lg" />
      <div className="shimmer mt-3 h-4 w-3/4 rounded-md" />
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="shimmer h-3.5 w-12 rounded-full" />
        <div className="shimmer h-3 w-10 rounded-md" />
      </div>
      <div className="shimmer mt-2 h-3 w-4/5 rounded-md" />
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
