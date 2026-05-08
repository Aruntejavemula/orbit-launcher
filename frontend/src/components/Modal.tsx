import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

function isDark() {
  return document.documentElement.classList.contains("dark");
}

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function Modal({ open, onClose, title, children, width = 480 }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Focus first focusable element on open
    const frame = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;

      const els = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
      ).filter((el) => !el.closest('[aria-hidden="true"]'));
      if (!els.length) return;

      const first = els[0];
      const last = els[els.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const dark = isDark();
  const backdropHidden = dark ? "rgba(0,0,0,0)" : "rgba(31,36,33,0)";
  const backdropVisible = dark ? "rgba(0,0,0,0.7)" : "rgba(31,36,33,0.45)";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6"
          style={{ background: backdropHidden }}
          animate={{ background: backdropVisible }}
          exit={{ background: backdropHidden }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <div className="pointer-events-none absolute inset-0 backdrop-blur-sm" />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="modal-panel relative my-auto w-full overflow-y-auto rounded-2xl p-6 shadow-pop pointer-events-auto"
            style={{ width, maxHeight: "calc(100vh - 48px)", background: "var(--modal-bg)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 id="modal-title" className="font-display text-xl font-semibold">
                {title}
              </h2>
              <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-ink-muted hover:bg-cream transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
