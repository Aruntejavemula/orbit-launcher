import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLogo from "./AppLogo";

interface Props {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const called = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setPhase("out"), 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleExitComplete = () => {
    if (!called.current) {
      called.current = true;
      onComplete();
    }
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {phase === "in" && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: "#0a1a0a" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <AppLogo className="h-24 w-24 rounded-2xl shadow-2xl" />
          </motion.div>
          <motion.h1
            className="mt-5 text-3xl font-semibold tracking-tight text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
          >
            Remio
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
