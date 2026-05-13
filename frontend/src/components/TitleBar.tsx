import { useState, useEffect } from "react";
import { Minus, Square, X, Copy } from "lucide-react";

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

let tauriWindow: typeof import("@tauri-apps/api/window") | null = null;

async function loadTauriWindow() {
  if (isTauri && !tauriWindow) {
    tauriWindow = await import("@tauri-apps/api/window");
  }
  return tauriWindow;
}

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!isTauri) return;

    let unlisten: (() => void) | undefined;

    (async () => {
      const mod = await loadTauriWindow();
      if (!mod) return;
      const win = mod.getCurrentWindow();
      setMaximized(await win.isMaximized());
      unlisten = await win.onResized(async () => {
        setMaximized(await win.isMaximized());
      });
    })();

    return () => {
      unlisten?.();
    };
  }, []);

  if (!isTauri) return null;

  const handleMinimize = async () => {
    const mod = await loadTauriWindow();
    if (mod) await mod.getCurrentWindow().minimize();
  };

  const handleMaximize = async () => {
    const mod = await loadTauriWindow();
    if (mod) await mod.getCurrentWindow().toggleMaximize();
  };

  const handleClose = async () => {
    const mod = await loadTauriWindow();
    if (mod) await mod.getCurrentWindow().hide();
  };

  return (
    <div
      data-tauri-drag-region
      className="fixed left-0 right-0 top-0 z-[9999] flex h-8 select-none items-center justify-between bg-[var(--surface)] border-b border-[var(--line)]"
    >
      <div data-tauri-drag-region className="flex items-center gap-2 pl-3">
        <img src="/app-hero-icon.jpeg" alt="" className="h-4 w-4 rounded-sm pointer-events-none" />
        <span className="text-xs font-medium text-[var(--text-muted)] pointer-events-none">Remio</span>
      </div>
      <div className="flex h-full">
        <button
          onClick={handleMinimize}
          className="grid h-full w-11 place-items-center transition-colors hover:bg-[var(--line)]"
          aria-label="Minimize"
        >
          <Minus size={14} className="text-[var(--text-muted)]" />
        </button>
        <button
          onClick={handleMaximize}
          className="grid h-full w-11 place-items-center transition-colors hover:bg-[var(--line)]"
          aria-label={maximized ? "Restore" : "Maximize"}
        >
          {maximized ? (
            <Copy size={12} className="text-[var(--text-muted)] rotate-90" />
          ) : (
            <Square size={12} className="text-[var(--text-muted)]" />
          )}
        </button>
        <button
          onClick={handleClose}
          className="grid h-full w-11 place-items-center transition-colors hover:bg-red-500 hover:text-white"
          aria-label="Close"
        >
          <X size={14} className="text-[var(--text-muted)] hover:text-white" />
        </button>
      </div>
    </div>
  );
}
