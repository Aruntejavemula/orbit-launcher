import { describe, expect, it } from "vitest";
import { resolveCatalogAppFields } from "./appCatalog";

describe("resolveCatalogAppFields", () => {
  it("fills name from catalog when API slug is valid but name missing", () => {
    expect(resolveCatalogAppFields("willow", "")).toEqual({
      slug: "willow",
      name: "Willow",
    });
  });

  it("fills slug and name when API returns generic App", () => {
    expect(resolveCatalogAppFields("app", "App")).toEqual({ slug: "app", name: "App" });
    expect(resolveCatalogAppFields("primevideo", "App")).toEqual({
      slug: "primevideo",
      name: "Amazon Prime Video",
    });
  });

  it("recovers catalog entry from url when slug and name are generic", () => {
    expect(
      resolveCatalogAppFields("app", "App", "https://open.spotify.com"),
    ).toEqual({ slug: "spotify", name: "Spotify" });
  });
});
