import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BottomNav from "./BottomNav";

describe("BottomNav", () => {
  const onNavigate = vi.fn();
  const onAdd = vi.fn();

  beforeEach(() => {
    onNavigate.mockReset();
    onAdd.mockReset();
  });

  it("renders all navigation items", () => {
    render(<BottomNav page="home" onNavigate={onNavigate} onAdd={onAdd} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Insights")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders Add button", () => {
    render(<BottomNav page="home" onNavigate={onNavigate} onAdd={onAdd} />);
    expect(screen.getByLabelText("Add")).toBeInTheDocument();
  });

  it("calls onNavigate with 'home' when Home clicked", () => {
    render(<BottomNav page="insights" onNavigate={onNavigate} onAdd={onAdd} />);
    fireEvent.click(screen.getByText("Home"));
    expect(onNavigate).toHaveBeenCalledWith("home");
  });

  it("calls onNavigate with 'insights' when Insights clicked", () => {
    render(<BottomNav page="home" onNavigate={onNavigate} onAdd={onAdd} />);
    fireEvent.click(screen.getByText("Insights"));
    expect(onNavigate).toHaveBeenCalledWith("insights");
  });

  it("calls onNavigate with 'calendar' when Calendar clicked", () => {
    render(<BottomNav page="home" onNavigate={onNavigate} onAdd={onAdd} />);
    fireEvent.click(screen.getByText("Calendar"));
    expect(onNavigate).toHaveBeenCalledWith("calendar");
  });

  it("calls onNavigate with 'settings' when Settings clicked", () => {
    render(<BottomNav page="home" onNavigate={onNavigate} onAdd={onAdd} />);
    fireEvent.click(screen.getByText("Settings"));
    expect(onNavigate).toHaveBeenCalledWith("settings");
  });

  it("calls onAdd when Add button clicked", () => {
    render(<BottomNav page="home" onNavigate={onNavigate} onAdd={onAdd} />);
    fireEvent.click(screen.getByLabelText("Add"));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("highlights active page", () => {
    render(<BottomNav page="calendar" onNavigate={onNavigate} onAdd={onAdd} />);
    const calBtn = screen.getByText("Calendar").closest("button")!;
    expect(calBtn.className).toContain("text-sage");
  });

  it("non-active pages are muted", () => {
    render(<BottomNav page="calendar" onNavigate={onNavigate} onAdd={onAdd} />);
    const homeBtn = screen.getByText("Home").closest("button")!;
    expect(homeBtn.className).toContain("text-ink-muted");
  });
});
