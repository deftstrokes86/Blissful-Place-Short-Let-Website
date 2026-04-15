import { render, screen, within, fireEvent } from "@testing-library/react";
import { usePathname } from "next/navigation";

import { SiteHeader } from "../SiteHeader";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("next/link", () => {
  const MockLink = ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, layoutId, ...rest }: { children?: React.ReactNode; layoutId?: string; [key: string]: unknown }) => (
      <div data-layout-id={layoutId} {...rest}>{children}</div>
    ),
    span: ({ children, layoutId, ...rest }: { children?: React.ReactNode; layoutId?: string; [key: string]: unknown }) => (
      <span data-layout-id={layoutId} {...rest}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/common/BrandLogo", () => ({
  BrandLogo: () => <div data-testid="brand-logo-stub" />,
}));

jest.mock("@/lib/lucide-react", () => ({
  ChevronDown: ({ "aria-hidden": ariaHidden, ...rest }: Record<string, unknown>) => (
    <svg data-testid="icon-chevron-down" aria-hidden={ariaHidden as boolean} {...rest} />
  ),
  Menu: () => <svg data-testid="icon-menu" />,
  X: () => <svg data-testid="icon-x" />,
}));

jest.mock("@/lib/site-config", () => ({
  SUPPORT_WHATSAPP_URL: "https://wa.me/test",
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockUsePathname = usePathname as jest.Mock;

function renderHeader(pathname = "/") {
  mockUsePathname.mockReturnValue(pathname);
  return render(<SiteHeader />);
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe("SiteHeader desktop nav (pill style)", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Structural / rendering ──────────────────────────────────────────────────

  it("1. renders all seven nav labels in the desktop nav", () => {
    renderHeader("/");
    const track = document.querySelector(".nav-pill-track");
    expect(track).not.toBeNull();
    const nav = track as HTMLElement;
    expect(within(nav).getByText("Home")).toBeInTheDocument();
    expect(within(nav).getByText("Flats")).toBeInTheDocument();
    expect(within(nav).getByText("Booking")).toBeInTheDocument();
    expect(within(nav).getByText("About")).toBeInTheDocument();
    expect(within(nav).getByText("Blog")).toBeInTheDocument();
    expect(within(nav).getByText("Guest Guide")).toBeInTheDocument();
    expect(within(nav).getByText("Contact")).toBeInTheDocument();
  });

  it("2. renders the desktop nav inside a single pill track container with class 'nav-pill-track'", () => {
    renderHeader("/");
    const tracks = document.querySelectorAll(".nav-pill-track");
    expect(tracks).toHaveLength(1);
  });

  it("3. each nav item is rendered as a Link with the correct href", () => {
    renderHeader("/");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const hrefs = Array.from(track.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/property");
    expect(hrefs).toContain("/book");
    expect(hrefs).toContain("/about");
    expect(hrefs).toContain("/blog");
    expect(hrefs).toContain("/guide");
    expect(hrefs).toContain("/contact");
  });

  it("4. the Booking item still renders its dropdown chevron", () => {
    renderHeader("/");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const bookingItem = track.querySelector(".nav-item-with-menu") as HTMLElement;
    expect(within(bookingItem).getByTestId("icon-chevron-down")).toBeInTheDocument();
  });

  it("5. the Booking item still renders its submenu with Availability and Private Tour links", () => {
    renderHeader("/");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const submenu = track.querySelector(".nav-submenu") as HTMLElement;
    expect(submenu).not.toBeNull();
    expect(within(submenu).getByText("Availability")).toBeInTheDocument();
    expect(within(submenu).getByText("Private Tour")).toBeInTheDocument();
    expect(within(submenu).getByRole("menuitem", { name: "Availability" })).toHaveAttribute("href", "/availability");
    expect(within(submenu).getByRole("menuitem", { name: "Private Tour" })).toHaveAttribute("href", "/tour");
  });

  // ── Active state by route ───────────────────────────────────────────────────

  it("6. when pathname is '/', the Home item is marked active (has data-active='true')", () => {
    renderHeader("/");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const homeItem = within(track).getByText("Home").closest(".nav-pill-item") as HTMLElement;
    expect(homeItem).toHaveAttribute("data-active", "true");
  });

  it("7. when pathname is '/property', the Flats item is marked active", () => {
    renderHeader("/property");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const item = within(track).getByText("Flats").closest(".nav-pill-item") as HTMLElement;
    expect(item).toHaveAttribute("data-active", "true");
  });

  it("8. when pathname is '/about', the About item is marked active", () => {
    renderHeader("/about");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const item = within(track).getByText("About").closest(".nav-pill-item") as HTMLElement;
    expect(item).toHaveAttribute("data-active", "true");
  });

  it("9. when pathname is '/book', the Booking item is marked active", () => {
    renderHeader("/book");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const item = within(track).getByText("Booking").closest(".nav-pill-item") as HTMLElement;
    expect(item).toHaveAttribute("data-active", "true");
  });

  it("10. when pathname is '/availability', the Booking item is marked active (booking subroute)", () => {
    renderHeader("/availability");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const item = within(track).getByText("Booking").closest(".nav-pill-item") as HTMLElement;
    expect(item).toHaveAttribute("data-active", "true");
  });

  it("11. when pathname is '/tour', the Booking item is marked active (booking subroute)", () => {
    renderHeader("/tour");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const item = within(track).getByText("Booking").closest(".nav-pill-item") as HTMLElement;
    expect(item).toHaveAttribute("data-active", "true");
  });

  it("12. when pathname is '/contact', no other item is marked active", () => {
    renderHeader("/contact");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const activeItems = track.querySelectorAll(".nav-pill-item[data-active='true']");
    expect(activeItems).toHaveLength(1);
    const activeItem = activeItems[0] as HTMLElement;
    expect(within(activeItem).getByText("Contact")).toBeInTheDocument();
  });

  it("13. the Home item is NOT active when pathname is '/property' (exact-match for root only)", () => {
    renderHeader("/property");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const homeItem = within(track).getByText("Home").closest(".nav-pill-item") as HTMLElement;
    expect(homeItem).not.toHaveAttribute("data-active", "true");
  });

  // ── Sliding pill highlight ──────────────────────────────────────────────────

  it("14. the active item contains a motion element with layoutId='nav-pill'", () => {
    renderHeader("/about");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const aboutItem = within(track).getByText("About").closest(".nav-pill-item") as HTMLElement;
    const pill = aboutItem.querySelector("[data-layout-id='nav-pill']");
    expect(pill).not.toBeNull();
  });

  it("15. only ONE element across the entire nav has layoutId='nav-pill' at any time", () => {
    renderHeader("/");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const pills = track.querySelectorAll("[data-layout-id='nav-pill']");
    expect(pills).toHaveLength(1);
  });

  // ── Hover/focus drives the pill ─────────────────────────────────────────────

  it("16. hovering a non-active nav item sets that item to data-hovered='true'", () => {
    renderHeader("/");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const flatsItem = within(track).getByText("Flats").closest(".nav-pill-item") as HTMLElement;
    fireEvent.mouseEnter(flatsItem);
    expect(flatsItem).toHaveAttribute("data-hovered", "true");
  });

  it("17. moving the mouse out of the nav clears the hovered state from all items", () => {
    renderHeader("/");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const flatsItem = within(track).getByText("Flats").closest(".nav-pill-item") as HTMLElement;
    fireEvent.mouseEnter(flatsItem);
    expect(flatsItem).toHaveAttribute("data-hovered", "true");
    fireEvent.mouseLeave(track);
    expect(flatsItem).not.toHaveAttribute("data-hovered", "true");
  });

  it("18. focusing a non-active nav item via keyboard sets data-hovered='true' on that item", () => {
    renderHeader("/");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const blogItem = within(track).getByText("Blog").closest(".nav-pill-item") as HTMLElement;
    fireEvent.focus(blogItem);
    expect(blogItem).toHaveAttribute("data-hovered", "true");
  });

  // ── Accessibility ───────────────────────────────────────────────────────────

  it("19. the pill highlight element has aria-hidden='true'", () => {
    renderHeader("/");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const pill = track.querySelector("[data-layout-id='nav-pill']") as HTMLElement;
    expect(pill).toHaveAttribute("aria-hidden", "true");
  });

  it("20. all nav links remain keyboard-focusable (tabIndex is not -1)", () => {
    renderHeader("/");
    const track = document.querySelector(".nav-pill-track") as HTMLElement;
    const links = Array.from(track.querySelectorAll("a"));
    // Exclude submenu links — focus on top-level nav links only
    const topLevelLinks = links.filter(
      (a) => !a.closest(".nav-submenu")
    );
    expect(topLevelLinks.length).toBeGreaterThan(0);
    topLevelLinks.forEach((link) => {
      expect(link).not.toHaveAttribute("tabIndex", "-1");
    });
  });

  // ── Regression — unchanged parts must still work ────────────────────────────

  it("21. the mobile nav still contains all seven nav labels", () => {
    renderHeader("/");
    const mobileNav = document.querySelector(".mobile-nav") as HTMLElement;
    expect(mobileNav).not.toBeNull();
    expect(within(mobileNav).getByText("Home")).toBeInTheDocument();
    expect(within(mobileNav).getByText("Flats")).toBeInTheDocument();
    expect(within(mobileNav).getByText("Booking")).toBeInTheDocument();
    expect(within(mobileNav).getByText("About")).toBeInTheDocument();
    expect(within(mobileNav).getByText("Blog")).toBeInTheDocument();
    expect(within(mobileNav).getByText("Guest Guide")).toBeInTheDocument();
    expect(within(mobileNav).getByText("Contact")).toBeInTheDocument();
  });

  it("22. the promo bar still renders with the default promo text", () => {
    renderHeader("/");
    expect(
      screen.getByText(/BOOK DIRECT.*15% OFF/i)
    ).toBeInTheDocument();
  });

  it("23. the 'Make an Inquiry' and 'Book Now' action buttons still render", () => {
    renderHeader("/");
    // Both appear in desktop actions AND mobile nav — just confirm at least one of each
    expect(screen.getAllByText("Make an Inquiry").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Book Now").length).toBeGreaterThan(0);
  });

});
