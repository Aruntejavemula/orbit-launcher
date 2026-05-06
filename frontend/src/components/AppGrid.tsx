import { useEffect, useState } from "react";
import type { AppItem } from "../types";
import AppCard from "./AppCard";
import { useApps } from "../context/AppsContext";

const PAGE_SIZE = 24;

interface Props {
  apps: AppItem[];
  totalApps: number;
  onOpenApp: (id: string) => void;
  query?: string;
  onClearSearch?: () => void;
}

export default function AppGrid({ apps, totalApps, onOpenApp, query, onClearSearch }: Props) {
  const { reorder } = useApps();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Reset page when the filtered list changes (search/category switch)
  useEffect(() => { setVisible(PAGE_SIZE); }, [apps]);

  if (apps.length === 0) {
    const isEmpty = totalApps === 0;
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{ background: "var(--surface)", border: "1px dashed var(--line)" }}
      >
        {isEmpty ? (
          <>
            <p className="text-lg font-semibold">No apps yet</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Hit the <strong>+</strong> button to add your first tool.
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold">
              {query ? `No results for "${query}"` : "No tools match your filter"}
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {query ? "Try a different search term or clear the search." : "Try a different category or add a new app."}
            </p>
            {query && onClearSearch && (
              <button
                onClick={onClearSearch}
                className="mt-4 rounded-full border px-4 py-1.5 text-sm font-medium transition hover:bg-cream"
                style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
              >
                Clear search
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  const page = apps.slice(0, visible);
  const hasMore = visible < apps.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {page.map((a) => (
          <AppCard
            key={a.id}
            app={a}
            onOpen={onOpenApp}
            isDragging={draggingId === a.id}
            isDropTarget={overId === a.id && draggingId !== a.id}
            onDragStart={setDraggingId}
            onDragOver={(id) => setOverId(id)}
            onDragEnd={() => {
              setDraggingId(null);
              setOverId(null);
            }}
            onDrop={(toId) => {
              if (draggingId && draggingId !== toId) reorder(draggingId, toId);
              setDraggingId(null);
              setOverId(null);
            }}
          />
        ))}
      </div>
      {hasMore && (
        <div className="flex items-center justify-center pt-2">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-full border px-5 py-2 text-sm font-medium transition hover:bg-cream"
            style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
          >
            Show more ({apps.length - visible} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
