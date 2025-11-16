export type SiteNavLink = {
  key: "home" | "cart" | "courses" | "tutor" | "about";
  label: string;
  href: string;
};

export const SITE_NAV_LINKS: SiteNavLink[] = [
  { key: "home", label: "Home", href: "/dashboard" },
  { key: "cart", label: "Cart", href: "/cart" },
  { key: "courses", label: "Courses", href: "/courses" },
  { key: "tutor", label: "Become a Tutor", href: "/become-a-tutor" },
  { key: "about", label: "About", href: "/about" },
];
