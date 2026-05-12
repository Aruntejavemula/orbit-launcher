import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import HeroIllustration from "./HeroIllustration";

describe("HeroIllustration", () => {
  it("renders the SVG for daytime (default branch)", () => {
    const { container } = render(<HeroIllustration hour={12} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the sunrise variant", () => {
    const { container } = render(<HeroIllustration hour={6} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the night variant with stars and moon", () => {
    const { container } = render(<HeroIllustration hour={23} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the dusk fallback branch", () => {
    const { container } = render(<HeroIllustration hour={18} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("uses the current hour when no prop given", () => {
    const { container } = render(<HeroIllustration />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
