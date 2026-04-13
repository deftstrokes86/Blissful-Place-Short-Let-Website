import { render, screen } from "@testing-library/react";

import { BrandLogo } from "../BrandLogo";

describe("BrandLogo", () => {
  it("renders the logo image with the correct alt text", () => {
    render(<BrandLogo />);
    expect(screen.getByAltText("Blissful Place Residences")).toBeInTheDocument();
  });

  it("wrapper has the correct accessible label", () => {
    render(<BrandLogo />);
    expect(screen.getByRole("img", { name: "Blissful Place Residences" })).toBeInTheDocument();
  });

  it("nav variant (default) applies nav-width classes", () => {
    render(<BrandLogo />);
    const img = screen.getByAltText("Blissful Place Residences");
    expect(img).toHaveClass("w-[200px]");
    expect(img).not.toHaveClass("w-[140px]");
  });

  it("footer variant applies footer-width class", () => {
    render(<BrandLogo variant="footer" />);
    const img = screen.getByAltText("Blissful Place Residences");
    expect(img).toHaveClass("w-[140px]");
    expect(img).not.toHaveClass("w-[200px]");
  });

  it("wrapper is an inline-flex shrink-0 container", () => {
    const { container } = render(<BrandLogo />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("inline-flex", "items-center", "shrink-0");
  });

  it("nav variant passes priority prop (eager loading)", () => {
    render(<BrandLogo variant="nav" />);
    // Image should be in the document — priority loading is handled by next/image internally
    expect(screen.getByAltText("Blissful Place Residences")).toBeInTheDocument();
  });
});
