import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function FloatingAddButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed bottom-24 right-8 z-30 grid h-14 w-14 place-items-center rounded-full bg-sage-dark text-paper shadow-fab md:bottom-8"
      aria-label="Add a new app"
    >
      <Plus size={22} strokeWidth={2.5} />
    </motion.button>
  );
}
