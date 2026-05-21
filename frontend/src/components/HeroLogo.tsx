import { HERO_ICON_JPEG } from "../lib/assets";

interface Props {
  className?: string;
  alt?: string;
}

/** Splash / login — black hero mark (app-hero-icon.jpeg). */
export default function HeroLogo({ className = "", alt = "Remio" }: Props) {
  return <img src={HERO_ICON_JPEG} alt={alt} className={className} />;
}
