import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, children, width = 480 }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 backdrop-blur-sm fade-in px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative my-auto w-full overflow-y-auto rounded-2xl bg-paper p-6 shadow-pop"
        style={{ width, maxHeight: "calc(100vh - 48px)" }}
      >
        <div className="flex items-start justify-between">
          <h2 id="modal-title" className="font-display text-xl font-semibold">
            {title}
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-ink-muted hover:bg-cream">
            <X size={18} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
