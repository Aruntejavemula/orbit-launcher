import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type?: ToastType;
}

let _push: ((t: ToastMessage) => void) | null = null;

export function toast(message: string, type: ToastType = "info") {
  _push?.({ id: Math.random().toString(36).slice(2), message, type });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    _push = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3500);
    };
    return () => { _push = null; };
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-pop"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              minWidth: 260,
              maxWidth: 360,
            }}
          >
            {t.type === "success" && <CheckCircle size={16} className="shrink-0 text-sage" />}
            {t.type === "error" && <AlertCircle size={16} className="shrink-0 text-red-500" />}
            {t.type === "info" && <Info size={16} className="shrink-0 text-sage-ink" />}
            <span className="flex-1 text-sm font-medium">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="shrink-0 text-ink-muted hover:text-ink">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
