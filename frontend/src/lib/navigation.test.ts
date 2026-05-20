import { describe, it, expect, vi, afterEach } from "vitest";
import {
  PAGE_PATHS,
  pageIdFromPathname,
  pathForPageId,
  isPackagedFile,
  appPathname,
  navigateAppRoot,
} from "./navigation";

function mockLocation(parts: Partial<Location>) {
  const loc = {
    protocol: "https:",
    pathname: "/",
    search: "",
    replace: vi.fn(),
    ...parts,
  } as Location;
  vi.stubGlobal("location", loc);
  return loc;
}

describe("navigation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps known paths to page ids", () => {
    expect(pageIdFromPathname("/settings")).toBe("settings");
    expect(pageIdFromPathname("/insights")).toBe("insights");
    expect(pageIdFromPathname("/unknown")).toBe("home");
  });

  it("maps page ids to paths", () => {
    expect(pathForPageId("calendar")).toBe("/calendar");
    expect(pathForPageId("home")).toBe("/");
  });

  it("exports stable PAGE_PATHS entries", () => {
    expect(PAGE_PATHS.some((p) => p.id === "api-keys" && p.path === "/api-keys")).toBe(true);
  });

  it("detects file:// as packaged", () => {
    mockLocation({ protocol: "file:" });
    expect(isPackagedFile()).toBe(true);
    expect(appPathname()).toBe("/");
  });

  it("reads browser pathname", () => {
    mockLocation({ protocol: "https:", pathname: "/settings", search: "?tab=legal" });
    expect(appPathname()).toBe("/settings");
  });

  it("navigateAppRoot uses index.html on file://", () => {
    mockLocation({ protocol: "file:" });
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    navigateAppRoot("?desktop=1");
    expect(replaceState).toHaveBeenCalledWith({}, "", "index.html?desktop=1");
  });

  it("navigateAppRoot replaces / on https", () => {
    const loc = mockLocation({ protocol: "https:" });
    navigateAppRoot("?x=1");
    expect(loc.replace).toHaveBeenCalledWith("/?x=1");
  });
});
