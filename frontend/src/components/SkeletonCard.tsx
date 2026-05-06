import { motion } from "framer-motion";

export default function SkeletonCard() {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" as const }}
      className="flex flex-col rounded-2xl p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
    >
      <div className="h-9 w-9 rounded-lg" style={{ background: "var(--bg-deep)" }} />
      <div className="mt-3 h-4 w-3/4 rounded-md" style={{ background: "var(--bg-deep)" }} />
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="h-3.5 w-12 rounded-full" style={{ background: "var(--bg-deep)" }} />
        <div className="h-3 w-10 rounded-md" style={{ background: "var(--bg-deep)" }} />
      </div>
      <div className="mt-2 h-3 w-4/5 rounded-md" style={{ background: "var(--bg-deep)" }} />
    </motion.div>
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
