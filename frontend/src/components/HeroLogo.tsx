import { HERO_ICON } from "../lib/assets";

interface Props {
  className?: string;
  alt?: string;
}

/** Splash / login — black hero mark (app-hero-icon.jpeg). */
export default function HeroLogo({ className = "", alt = "Remio" }: Props) {
  return <img src={HERO_ICON} alt={alt} className={className} />;
}
