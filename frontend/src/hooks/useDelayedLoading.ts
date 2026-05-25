import { useEffect, useState } from "react";

/** Show loading UI only if `active` stays true longer than `delayMs`. */
export function useDelayedLoading(active: boolean, delayMs = 100): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const t = window.setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [active, delayMs]);

  return active && show;
}
