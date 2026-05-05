import { categories } from "../data/categories";
import type { CategoryId } from "../types";

interface Props {
  active: CategoryId;
  onChange: (id: CategoryId) => void;
}

export default function CategoryFilters({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {categories.map((c) => {
        const Icon = c.icon;
        const isActive = active === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`filter-pill ${isActive ? "active" : ""}`}
          >
            <Icon size={14} />
            <span>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
