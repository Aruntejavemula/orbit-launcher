import { Orbit as OrbitIcon } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-app px-6">
      <div className="text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sage text-paper mx-auto mb-6">
          <OrbitIcon size={26} strokeWidth={2.5} />
        </span>
        <h1 className="text-6xl font-bold text-ink mb-3">404</h1>
        <p className="text-ink-muted text-base mb-8">
          This page doesn't exist.
        </p>
        <a
          href="/"
          className="btn-primary inline-block px-6 py-2.5 text-sm"
        >
          Back to dashboard
        </a>
      </div>
    </main>
  );
}
