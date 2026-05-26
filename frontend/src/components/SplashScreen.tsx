import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeroLogo from "./HeroLogo";
import { appleSpring, appleSpringGentle, fadeUpVariants } from "../lib/motion";

interface Props {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const called = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setPhase("out"), 1400);
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
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-2xl"
          style={{ background: "rgba(10, 10, 10, 0.97)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={appleSpring}
          >
            <HeroLogo className="h-24 w-24 rounded-2xl object-cover shadow-2xl" />
          </motion.div>
          <motion.h1
            className="mt-5 text-3xl font-semibold tracking-tight text-white"
            variants={fadeUpVariants}
            initial="initial"
            animate="animate"
            transition={{ ...appleSpringGentle, delay: 0.12 }}
          >
            Remio
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
