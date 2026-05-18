import { APP_ICON_JPEG, APP_ICON_SVG } from "../lib/assets";

interface Props {
  className?: string;
  alt?: string;
}

export default function AppLogo({ className = "", alt = "Remio" }: Props) {
  return (
    <img
      src={APP_ICON_SVG}
      alt={alt}
      className={className}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src !== APP_ICON_JPEG) img.src = APP_ICON_JPEG;
      }}
    />
  );
}
