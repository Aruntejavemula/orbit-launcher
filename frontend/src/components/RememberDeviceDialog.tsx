interface Props {
  open: boolean;
  onChoose: (remember: boolean) => void;
}

export default function RememberDeviceDialog({ open, onChoose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/40 backdrop-blur-sm fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remember-device-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white p-6 shadow-pop">
        <h3 id="remember-device-title" className="text-lg font-semibold text-ink">
          Remember this device?
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          Stay signed in for up to 90 days. Choose &ldquo;No thanks&rdquo; to stay signed in for 7 days on this
          device.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => onChoose(false)}
            className="flex-1 rounded-xl border border-line py-2.5 text-sm font-medium text-ink-muted transition hover:bg-cream"
          >
            No thanks
          </button>
          <button type="button" onClick={() => onChoose(true)} className="btn-primary flex-1 py-2.5 text-sm">
            Yes, remember
          </button>
        </div>
      </div>
    </div>
  );
}
