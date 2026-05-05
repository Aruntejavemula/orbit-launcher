import { Plus } from "lucide-react";

export default function FloatingAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-8 z-30 grid h-14 w-14 place-items-center rounded-full bg-sage-dark text-paper shadow-fab transition hover:scale-105 md:bottom-8"
      aria-label="Add a new app"
    >
      <Plus size={22} strokeWidth={2.5} />
    </button>
  );
}
