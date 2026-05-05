import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6"
          style={{ background: "rgba(31,36,33,0)" }}
          animate={{ background: "rgba(31,36,33,0.45)" }}
          exit={{ background: "rgba(31,36,33,0)" }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <div className="pointer-events-none absolute inset-0 backdrop-blur-sm" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative my-auto w-full overflow-y-auto rounded-2xl bg-paper p-6 shadow-pop pointer-events-auto"
            style={{ width, maxHeight: "calc(100vh - 48px)" }}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
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
