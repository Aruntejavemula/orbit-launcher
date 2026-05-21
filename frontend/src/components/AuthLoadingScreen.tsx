import { motion } from "framer-motion";
import HeroLogo from "./HeroLogo";
import { appleSpringGentle, fadeUpVariants } from "../lib/motion";

/** Stable full-screen placeholder during OAuth return and session resolution. */
export default function AuthLoadingScreen() {
  return (
    <motion.div
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#0d0d0d]"
      role="status"
      aria-live="polite"
      aria-label="Signing in"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <motion.div
        variants={fadeUpVariants}
        initial="initial"
        animate="animate"
        transition={appleSpringGentle}
      >
        <HeroLogo className="h-14 w-14 rounded-2xl object-cover shadow-2xl" />
      </motion.div>
      <motion.div
        className="h-8 w-8 rounded-full border-2 border-white/12 border-t-[#e8541a]"
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}
