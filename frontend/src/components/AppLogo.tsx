import { useState } from "react";
import { APP_ICON_JPEG, APP_ICON_SVG } from "../lib/assets";

interface Props {
  alt?: string;
  className?: string;
}

/** Remio app mark — jpeg when present in public/, else bundled SVG. */
export default function AppLogo({ alt = "Remio", className = "h-9 w-9 rounded-xl object-cover" }: Props) {
  const [src, setSrc] = useState(APP_ICON_JPEG);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        if (src !== APP_ICON_SVG) setSrc(APP_ICON_SVG);
      }}
    />
  );
}
