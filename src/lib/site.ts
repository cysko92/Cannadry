/**
 * Site-wide settings. Values marked PLACEHOLDER must be replaced before launch.
 */
export const site = {
  name: "CannaDry",
  tagline: "Licensed cannabis wholesale from British Columbia.",
  // PLACEHOLDER: CannaDry's Health Canada licence number.
  licenceNumber: "X",
  // PLACEHOLDER: legal entity name, address and contact details.
  legalName: "CannaDry (legal entity name to confirm)",
  address: "British Columbia, Canada",
  email: "trade@cannadry.example",
  phone: "+1 (000) 000-0000",
  minimumAge: 19,
} as const;

export const publicNav = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
