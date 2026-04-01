/**
 * Tests for app/not-found.tsx (TDD).
 *
 * Styling is done via inline styles and scoped CSS class names in a <style>
 * block — not Tailwind utilities. Tests check DOM structure, inline styles,
 * links, and scoped class names.
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import NotFound from "../not-found";

// ─── Helper ──────────────────────────────────────────────────────────────────

function getRootDiv(container: HTMLElement): HTMLElement {
  const div = container.querySelector("[data-testid='not-found-root']");
  if (!div) throw new Error("Root container not found");
  return div as HTMLElement;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("NotFound (404 page)", () => {
  it("renders without crashing", () => {
    expect(() => render(<NotFound />)).not.toThrow();
  });

  it('displays the "404" text', () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it('renders the serif heading "This Room Doesn\'t Exist"', () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { name: /this room doesn't exist/i })
    ).toBeInTheDocument();
  });

  it('"Return to Lobby" is a link pointing to "/"', () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /return to lobby/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it('"Return to Lobby" uses the primary button class (rose bg, white text)', () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /return to lobby/i });
    expect(link).toHaveClass("nf-btn-primary");
  });

  it('"Explore Residences" is a link pointing to "/property"', () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /explore residences/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/property");
  });

  it('"Explore Residences" uses the secondary link class (rose text)', () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /explore residences/i });
    expect(link).toHaveClass("nf-btn-secondary");
  });

  it("root container uses fixed positioning to escape parent layout flow", () => {
    const { container } = render(<NotFound />);
    const root = getRootDiv(container);
    expect(root).toHaveStyle("position: fixed");
  });

  it("root container fills the viewport (inset: 0)", () => {
    const { container } = render(<NotFound />);
    const root = getRootDiv(container);
    expect(root).toHaveStyle("inset: 0");
  });

  it("root container centres content with flexbox", () => {
    const { container } = render(<NotFound />);
    const root = getRootDiv(container);
    expect(root).toHaveStyle("display: flex");
    expect(root).toHaveStyle("align-items: center");
    expect(root).toHaveStyle("justify-content: center");
  });

  it("root container clips overflow (particles stay inside)", () => {
    const { container } = render(<NotFound />);
    const root = getRootDiv(container);
    expect(root).toHaveStyle("overflow: hidden");
  });

  it("content wrapper sits above the particle layer (z-index: 10)", () => {
    const { container } = render(<NotFound />);
    // The direct content div carries z-index: 10 via inline style.
    const zLayer = container.querySelector("[style*='z-index: 10']");
    expect(zLayer).toBeInTheDocument();
  });

  it("all key content is rendered and visible", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /this room doesn't exist/i })
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /return to lobby/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /explore residences/i })).toBeVisible();
  });
});
