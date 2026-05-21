import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AppItem } from "../types";
import AppCard from "./AppCard";
import AppListRow from "./AppListRow";
import { useApps } from "../context/AppsContext";
import { usePrefs } from "../context/PreferencesContext";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { cardContainer, cardTransition, cardVariants } from "../lib/motion";

const PAGE_SIZE = 24;
const DESKTOP_QUERY = "(min-width: 768px)";

interface Props {
  apps: AppItem[];
  totalApps: number;
  onOpenApp: (id: string) => void;
  query?: string;
  onClearSearch?: () => void;
}

function ShowMoreButton({ remaining, onClick }: { remaining: number; onClick: () => void }) {
  return (
    <div className="flex items-center justify-center pt-2">
      <button
        type="button"
        onClick={onClick}
        className="rounded-full border px-5 py-2 text-sm font-medium transition hover:bg-cream"
        style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
      >
        Show more ({remaining} remaining)
      </button>
    </div>
  );
}

export default function AppGrid({ apps, totalApps, onOpenApp, query, onClearSearch }: Props) {
  const { reorder, launch } = useApps();
  const { prefs } = usePrefs();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const country = prefs.country ?? "";

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [apps]);

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
                type="button"
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
      {!isDesktop ? (
        <motion.div
          className="flex flex-col gap-2"
          data-testid="app-grid-mobile"
          variants={cardContainer}
          initial="initial"
          animate="animate"
        >
          <AnimatePresence mode="popLayout">
            {page.map((a) => (
              <motion.div
                key={a.id}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0, y: 12 }}
                transition={cardTransition}
              >
                <AppListRow
                  app={a}
                  countryCode={country}
                  showLastOpened={prefs.showLastOpened}
                  onOpen={onOpenApp}
                  onLaunch={launch}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          data-testid="app-grid-desktop"
          className={`grid grid-cols-2 lg:grid-cols-4 ${prefs.compactCards ? "gap-2" : "gap-2 sm:gap-3"}`}
          variants={cardContainer}
          initial="initial"
          animate="animate"
        >
          <AnimatePresence mode="popLayout">
            {page.map((a) => (
              <motion.div
                key={a.id}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0, y: 12 }}
                transition={cardTransition}
              >
                <AppCard
                  app={a}
                  countryCode={country}
                  uiDark={prefs.theme === "dark"}
                  compact={prefs.compactCards}
                  showLastOpened={prefs.showLastOpened}
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
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {hasMore && (
        <ShowMoreButton remaining={apps.length - visible} onClick={() => setVisible((v) => v + PAGE_SIZE)} />
      )}
    </div>
  );
}
