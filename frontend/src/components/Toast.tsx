import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

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
    <AnimatePresence>
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => dismiss(t.id)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center gap-4 rounded-2xl px-8 py-6 shadow-pop"
            style={{ background: "var(--surface)", border: "1px solid var(--line)", minWidth: 280 }}
          >
            {t.type === "success" && <CheckCircle size={40} className="text-sage" />}
            {t.type === "error" && <AlertCircle size={40} className="text-red-500" />}
            {t.type === "info" && <Info size={40} className="text-sage-ink" />}
            <span className="text-base font-semibold text-center">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="mt-1 rounded-full px-6 py-2 text-sm font-semibold transition-colors"
              style={{ background: "var(--sage-dark, #4F6B54)", color: "#fff" }}
            >
              Dismiss
            </button>
          </motion.div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
