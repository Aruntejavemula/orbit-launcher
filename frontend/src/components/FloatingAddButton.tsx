import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { fabTap } from "../lib/motion";

export default function FloatingAddButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      {...fabTap}
      className="fab-add fixed bottom-8 right-8 z-30 hidden h-14 w-14 place-items-center rounded-full shadow-fab md:grid"
      aria-label="Add a new app"
    >
      <Plus size={22} strokeWidth={2.5} />
    </motion.button>
  );
}
