import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AppGrid from "./AppGrid";
import type { AppItem } from "../types";

// Mock AppsContext
vi.mock("../context/AppsContext", () => ({
  useApps: () => ({ reorder: vi.fn() }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

function makeApp(id: string, name: string): AppItem {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    color: "ff7262",
    url: `https://${name.toLowerCase()}.com`,
    category: "ai",
    plan: "free",
    createdAt: Date.now(),
    lastOpened: null,
  };
}

describe("AppGrid", () => {
  const onOpenApp = vi.fn();
  const onClearSearch = vi.fn();

  beforeEach(() => {
    onOpenApp.mockReset();
    onClearSearch.mockReset();
  });

  describe("empty states", () => {
    it("shows 'No apps yet' when totalApps=0", () => {
      render(
        <AppGrid apps={[]} totalApps={0} onOpenApp={onOpenApp} />
      );
      expect(screen.getByText("No apps yet")).toBeInTheDocument();
    });

    it("shows 'No results' message with query", () => {
      render(
        <AppGrid apps={[]} totalApps={5} onOpenApp={onOpenApp} query="xyz" onClearSearch={onClearSearch} />
      );
      expect(screen.getByText(/No results for "xyz"/)).toBeInTheDocument();
    });

    it("shows 'No tools match' without query", () => {
      render(
        <AppGrid apps={[]} totalApps={5} onOpenApp={onOpenApp} />
      );
      expect(screen.getByText(/No tools match your filter/)).toBeInTheDocument();
    });

    it("shows clear search button when query present", () => {
      render(
        <AppGrid apps={[]} totalApps={5} onOpenApp={onOpenApp} query="xyz" onClearSearch={onClearSearch} />
      );
      fireEvent.click(screen.getByText("Clear search"));
      expect(onClearSearch).toHaveBeenCalled();
    });
  });

  describe("pagination", () => {
    it("shows first 24 apps", () => {
      const apps = Array.from({ length: 30 }, (_, i) => makeApp(`id-${i}`, `App${i}`));
      render(<AppGrid apps={apps} totalApps={30} onOpenApp={onOpenApp} />);
      expect(screen.getByText("App0")).toBeInTheDocument();
      expect(screen.getByText("App23")).toBeInTheDocument();
      expect(screen.queryByText("App24")).not.toBeInTheDocument();
    });

    it("shows 'Show more' button when more apps available", () => {
      const apps = Array.from({ length: 30 }, (_, i) => makeApp(`id-${i}`, `App${i}`));
      render(<AppGrid apps={apps} totalApps={30} onOpenApp={onOpenApp} />);
      expect(screen.getByText(/Show more/)).toBeInTheDocument();
      expect(screen.getByText(/6 remaining/)).toBeInTheDocument();
    });

    it("does not show 'Show more' when all visible", () => {
      const apps = Array.from({ length: 5 }, (_, i) => makeApp(`id-${i}`, `App${i}`));
      render(<AppGrid apps={apps} totalApps={5} onOpenApp={onOpenApp} />);
      expect(screen.queryByText(/Show more/)).not.toBeInTheDocument();
    });

    it("loads more on button click", () => {
      const apps = Array.from({ length: 30 }, (_, i) => makeApp(`id-${i}`, `App${i}`));
      render(<AppGrid apps={apps} totalApps={30} onOpenApp={onOpenApp} />);
      fireEvent.click(screen.getByText(/Show more/));
      expect(screen.getByText("App24")).toBeInTheDocument();
      expect(screen.getByText("App29")).toBeInTheDocument();
    });
  });

  describe("rendering apps", () => {
    it("renders app cards", () => {
      const apps = [makeApp("1", "Figma"), makeApp("2", "Slack")];
      render(<AppGrid apps={apps} totalApps={2} onOpenApp={onOpenApp} />);
      expect(screen.getByText("Figma")).toBeInTheDocument();
      expect(screen.getByText("Slack")).toBeInTheDocument();
    });
  });
});
