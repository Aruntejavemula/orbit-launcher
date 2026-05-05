import { useState } from "react";
import type { AppItem } from "../types";
import AppCard from "./AppCard";
import { useApps } from "../context/AppsContext";

interface Props {
  apps: AppItem[];
  totalApps: number;
  onOpenApp: (id: string) => void;
}

export default function AppGrid({ apps, totalApps, onOpenApp }: Props) {
  const { reorder } = useApps();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  if (apps.length === 0) {
    const isEmpty = totalApps === 0;
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{ background: "var(--surface)", border: "1px dashed var(--line)" }}
      >
        {isEmpty ? (
          <>
            <p className="font-display text-lg font-semibold">No apps yet</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Hit the <strong>+</strong> button to add your first tool.
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-lg font-semibold">No tools match your filter</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Try a different category, clear search, or add a new app.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {apps.map((a) => (
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
  );
}
