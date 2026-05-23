import { isCapacitorNative } from "../lib/capacitor";
import RemioLoading from "./RemioLoading";

/** Stable full-screen placeholder during OAuth return and session resolution. */
export default function AuthLoadingScreen() {
  if (isCapacitorNative()) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-app"
        role="status"
        aria-live="polite"
        aria-label="Signing in"
      >
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-sage border-t-transparent"
          aria-hidden
        />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Signing in…
        </p>
      </div>
    );
  }

  return <RemioLoading active variant="screen" label="Signing in" delayMs={100} />;
}
