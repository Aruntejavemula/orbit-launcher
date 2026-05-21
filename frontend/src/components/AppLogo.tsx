import { HERO_ICON_JPEG } from "../lib/assets";

interface Props {
  className?: string;
  alt?: string;
}

/** In-app chrome (sidebar) — same black mark as splash (app-hero-icon.jpeg). */
export default function AppLogo({ className = "", alt = "Remio" }: Props) {
  return <img src={HERO_ICON_JPEG} alt={alt} className={className} />;
}
