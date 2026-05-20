import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { backdropTransition, modalTransition, modalVariants } from "../lib/motion";

interface Props {
  open: boolean;
  onClose: () => void;
  /** When false, hide close control and ignore Escape / backdrop dismiss. */
  closable?: boolean;
  /** Ignored when `header` is provided */
  title?: string;
  /** Custom header row (replaces default title + close) */
  header?: ReactNode;
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

export default function Modal({
  open,
  onClose,
  closable = true,
  title = "",
  header,
  children,
  width = 480,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Initial focus — only runs when modal opens
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Keyboard listener + scroll lock — re-attaches on open/onClose change
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closable) { onClose(); return; }
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
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, closable]);

  const dark = isDark();
  const backdropHidden = dark ? "rgba(0,0,0,0)" : "rgba(31,36,33,0)";
  const backdropVisible = dark ? "rgba(0,0,0,0.7)" : "rgba(31,36,33,0.45)";

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-start justify-center px-4 py-6"
          style={{ background: backdropHidden }}
          animate={{ background: backdropVisible }}
          exit={{ background: backdropHidden }}
          transition={backdropTransition}
          onClick={closable ? onClose : undefined}
        >
          <div className="pointer-events-none absolute inset-0 backdrop-blur-md" />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="modal-panel relative my-auto w-full overflow-y-auto rounded-2xl p-6 shadow-pop pointer-events-auto"
            style={{ width, maxHeight: "calc(100vh - 48px)", background: "var(--modal-bg)" }}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={modalTransition}
            onClick={(e) => e.stopPropagation()}
          >
            {header ?? (
              <div className="flex items-start justify-between">
                <h2 id="modal-title" className="font-display text-xl font-semibold">
                  {title}
                </h2>
                {closable && (
                  <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-ink-muted hover:bg-cream transition-colors">
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            <div className={header ? "" : "mt-4"}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
