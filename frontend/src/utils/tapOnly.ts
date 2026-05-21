import type { MouseEvent, PointerEvent } from "react";

const MOVE_THRESHOLD_PX = 12;

/** Ignore clicks that come from scrolling/dragging (common on touch sidebars). */
export function tapOnlyHandlers(onTap: () => void) {
  let startX = 0;
  let startY = 0;
  let moved = false;
  let activePointer = -1;

  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.button !== 0) return;
      activePointer = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      moved = false;
    },
    onPointerMove: (e: PointerEvent) => {
      if (e.pointerId !== activePointer) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD_PX) {
        moved = true;
      }
    },
    onPointerUp: (e: PointerEvent) => {
      if (e.pointerId !== activePointer) return;
      activePointer = -1;
      if (!moved) {
        e.preventDefault();
        onTap();
      }
    },
    onPointerCancel: () => {
      activePointer = -1;
      moved = true;
    },
    onClick: (e: MouseEvent) => {
      e.preventDefault();
    },
  };
}
