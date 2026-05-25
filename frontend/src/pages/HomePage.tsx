import { useMemo, useState } from "react";
import HeroCard from "../components/HeroCard";
import CategoryFilters from "../components/CategoryFilters";
import AppGrid from "../components/AppGrid";
import RemioLoading from "../components/RemioLoading";
import { useApps } from "../context/AppsContext";
import type { CategoryId } from "../types";

interface Props {
  onOpenApp: (id: string) => void;
}

export default function HomePage({ onOpenApp }: Props) {
  const { apps, appsLoading } = useApps();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q)
      );
    });
  }, [apps, query, category]);

  const totalApps = apps.length;

  return (
    <div className="flex flex-col gap-3 sm:gap-6 page-enter">
      <HeroCard query={query} onQuery={setQuery} />
      <CategoryFilters active={category} onChange={setCategory} />
      {appsLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <RemioLoading active variant="inline" label="Loading apps" delayMs={100} />
        </div>
      ) : (
        <AppGrid
          apps={visible}
          totalApps={totalApps}
          onOpenApp={onOpenApp}
          query={query.trim() || undefined}
          onClearSearch={() => setQuery("")}
        />
      )}
    </div>
  );
}
