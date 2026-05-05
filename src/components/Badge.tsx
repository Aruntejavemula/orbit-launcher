import type { Plan } from "../types";

const styles: Record<Plan, string> = {
  paid: "bg-sage-dark text-white",
  free: "bg-ink/70 text-white",
  trial: "bg-amberish text-white",
};

export default function Badge({ plan, size = "sm" }: { plan: Plan; size?: "sm" | "md" }) {
  const padding = size === "md" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider ${padding} ${styles[plan]}`}
    >
      {plan}
    </span>
  );
}
