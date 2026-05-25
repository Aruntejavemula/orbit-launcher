import { useEffect, useRef } from "react";
import { DotLottie } from "@lottiefiles/dotlottie-web";
import { useDelayedLoading } from "../hooks/useDelayedLoading";
import { isCapacitorNative } from "../lib/capacitor";

const LOTTI_SRC = "/animations/loading.lottie";

type Variant = "inline" | "screen";

interface Props {
  active: boolean;
  variant?: Variant;
  label?: string;
  delayMs?: number;
}

export default function RemioLoading({
  active,
  variant = "screen",
  label = "Loading",
  delayMs = 100,
}: Props) {
  const show = useDelayedLoading(active, delayMs);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<DotLottie | null>(null);

  useEffect(() => {
    if (!show || !canvasRef.current) {
      playerRef.current?.destroy();
      playerRef.current = null;
      return;
    }

    const player = new DotLottie({
      canvas: canvasRef.current,
      src: LOTTI_SRC,
      autoplay: true,
      loop: true,
    });
    playerRef.current = player;

    return () => {
      player.destroy();
      playerRef.current = null;
    };
  }, [show]);

  if (!show) return null;

  // Native: avoid DotLottie WASM on startup (blocks FCM / permission work on main thread)
  if (isCapacitorNative() && variant === "screen") {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4"
        style={{ background: "rgba(0,0,0,0.45)" }}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-sage border-t-transparent"
          aria-hidden
        />
        <p className="text-sm text-paper/90">{label}</p>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <canvas
        ref={canvasRef}
        role="status"
        aria-label={label}
        className="h-8 w-8"
        width={32}
        height={32}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <canvas ref={canvasRef} width={120} height={120} className="h-[120px] w-[120px]" />
    </div>
  );
}
