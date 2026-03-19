import type { CSSProperties, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "color"> & {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
};

export type LucideIcon = (props: IconProps) => JSX.Element;

function toNumber(value: number | string | undefined, fallback: number): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function icon(path: JSX.Element): LucideIcon {
  return function Icon({
    size = 24,
    color = "currentColor",
    strokeWidth = 2,
    style,
    ...rest
  }: IconProps) {
    const normalized = toNumber(size, 24);
    const computedStyle: CSSProperties = { width: normalized, height: normalized, ...style };

    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={computedStyle}
        aria-hidden="true"
        {...rest}
      >
        {path}
      </svg>
    );
  };
}

export const ArrowLeft = icon(<path d="M19 12H5m7-7-7 7 7 7" />);
export const Calendar = icon(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>,
);
export const CalendarDays = Calendar;
export const User = icon(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.7-3.2 4.5-5 8-5s6.3 1.8 8 5" />
  </>,
);
export const Users = icon(
  <>
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 19c1.2-2.7 3.2-4 6-4m4 4c1-2 2.6-3 4.8-3" />
  </>,
);
export const Zap = icon(<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />);
export const MessageSquare = icon(
  <>
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M8 18v3l4-3" />
  </>,
);
export const Shield = icon(
  <>
    <path d="M12 3 5 6v6c0 4.7 2.7 7.8 7 9 4.3-1.2 7-4.3 7-9V6l-7-3Z" />
  </>,
);
export const ShieldCheck = icon(
  <>
    <path d="M12 3 5 6v6c0 4.7 2.7 7.8 7 9 4.3-1.2 7-4.3 7-9V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </>,
);
export const BookOpen = icon(
  <>
    <path d="M3 6a3 3 0 0 1 3-3h5v18H6a3 3 0 0 0-3 3V6Z" />
    <path d="M21 6a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3V6Z" />
  </>,
);
export const Star = icon(<path d="m12 3 2.8 5.6 6.2.9-4.5 4.4 1 6.1L12 17.8 6.5 20l1-6.1L3 9.5l6.2-.9L12 3Z" />);
export const Sparkles = icon(
  <>
    <path d="M12 3 13.6 7.4 18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
    <path d="m5 16 .8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Z" />
    <path d="m19 14 .6 1.4L21 16l-1.4.6L19 18l-.6-1.4L17 16l1.4-.6L19 14Z" />
  </>,
);
export const MapPin = icon(
  <>
    <path d="M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z" />
    <circle cx="12" cy="10" r="2.5" />
  </>,
);
export const Plane = icon(<path d="m2 16 20-8-8 20-2-8-8-2Z" />);
export const Coffee = icon(
  <>
    <path d="M4 11h11a3 3 0 0 1 0 6H4v-6Z" />
    <path d="M4 17a4 4 0 0 0 4 4h5a4 4 0 0 0 4-4M8 3v3M12 2v4M16 3v3" />
  </>,
);
export const ChevronDown = icon(<path d="m6 9 6 6 6-6" />);
export const CheckCircle2 = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 2.5 2.5L16 9" />
  </>,
);
export const Wifi = icon(
  <>
    <path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 15.5a6 6 0 0 1 7 0" />
    <circle cx="12" cy="19" r="1" />
  </>,
);
export const Menu = icon(
  <>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </>,
);
export const X = icon(<path d="m18 6-12 12M6 6l12 12" />);
export const Instagram = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" />
  </>,
);
export const Twitter = icon(<path d="M22 5.8c-.7.3-1.4.5-2.1.6a3.7 3.7 0 0 0 1.6-2 7.2 7.2 0 0 1-2.3.9 3.6 3.6 0 0 0-6.2 2.4c0 .3 0 .6.1.9A10.2 10.2 0 0 1 4.2 4.8a3.6 3.6 0 0 0 1.1 4.8A3.4 3.4 0 0 1 3.8 9v.1a3.6 3.6 0 0 0 2.9 3.5 3.8 3.8 0 0 1-1.6.1 3.6 3.6 0 0 0 3.4 2.5A7.4 7.4 0 0 1 3 16.7a10.5 10.5 0 0 0 5.7 1.7c6.9 0 10.7-5.7 10.7-10.7v-.5c.7-.5 1.3-1.1 1.8-1.8Z" />);
export const Linkedin = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 10v7M8 7.5v.01M12 17v-4a2 2 0 1 1 4 0v4" />
  </>,
);
export const WhatsApp: LucideIcon = ({
  size = 24,
  color = "currentColor",
  style,
  ...rest
}: IconProps) => {
  const normalized = toNumber(size, 24);
  const computedStyle: CSSProperties = { width: normalized, height: normalized, ...style };

  return (
    <svg
      viewBox="0 0 24 24"
      fill={color}
      stroke="none"
      style={computedStyle}
      aria-hidden="true"
      {...rest}
    >
      <path d="M19.11 4.89A9.86 9.86 0 0 0 12 2C6.49 2 2 6.49 2 12c0 1.73.45 3.42 1.29 4.9L2 22l5.23-1.33A9.94 9.94 0 0 0 12 22h.01c5.51 0 9.99-4.49 9.99-10 0-2.67-1.04-5.18-2.9-7.11ZM12 20.31h-.01a8.25 8.25 0 0 1-4.2-1.15l-.3-.18-3.06.78.82-2.98-.2-.31A8.26 8.26 0 0 1 3.69 12c0-4.58 3.73-8.31 8.31-8.31a8.25 8.25 0 0 1 5.87 2.43A8.24 8.24 0 0 1 20.31 12c0 4.58-3.73 8.31-8.31 8.31Zm4.55-6.21c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.96-.14.16-.28.18-.53.06-.25-.12-1.04-.38-1.97-1.22-.73-.65-1.23-1.45-1.38-1.7-.15-.25-.02-.38.11-.5.11-.11.24-.29.36-.44.12-.15.16-.25.24-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.77-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.24.9 2.43 1.03 2.6.12.16 1.76 2.69 4.26 3.77.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.46-.6 1.66-1.17.2-.57.2-1.06.14-1.16-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  );
};
export const ShoppingBag = icon(
  <>
    <path d="M6 8h12l-1 12H7L6 8Z" />
    <path d="M9 8a3 3 0 1 1 6 0" />
  </>,
);
export const Lock = icon(
  <>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 1 1 8 0v3" />
  </>,
);
export const Home = icon(
  <>
    <path d="M3 11 12 4l9 7" />
    <path d="M5 10v10h14V10" />
  </>,
);
export const Clock = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v6l4 2" />
  </>,
);
export const Check = icon(<path d="m5 13 4 4L19 7" />);
export const Phone = icon(<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .8 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.4a2 2 0 0 1 2.1-.4c.9.4 1.9.7 2.9.8a2 2 0 0 1 1.6 1.9Z" />);
export const Info = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </>,
);
export const AlertTriangle = icon(
  <>
    <path d="M12 3 2 21h20L12 3Z" />
    <path d="M12 9v5M12 17h.01" />
  </>,
);
export const BedDouble = icon(
  <>
    <path d="M3 11h18v7H3v-7Zm0 7v3m18-3v3" />
    <path d="M6 11V8h4a2 2 0 0 1 2 2v1M12 11V9h5a2 2 0 0 1 2 2" />
  </>,
);
export const Bath = icon(
  <>
    <path d="M4 11h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-4Z" />
    <path d="M7 11V7a2 2 0 1 1 4 0" />
  </>,
);
export const Car = icon(
  <>
    <path d="M4 14h16l-1.5-4H5.5L4 14Z" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
  </>,
);
export const Tv = icon(
  <>
    <rect x="3" y="5" width="18" height="13" rx="2" />
    <path d="M8 21h8M12 5V3" />
  </>,
);

