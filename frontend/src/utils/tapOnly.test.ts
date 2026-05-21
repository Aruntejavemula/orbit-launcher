import { describe, it, expect, vi } from "vitest";
import type { PointerEvent } from "react";
import { tapOnlyHandlers } from "./tapOnly";

function ptr(partial: { clientX: number; clientY: number; pointerId?: number }) {
  return {
    button: 0,
    pointerId: partial.pointerId ?? 1,
    clientX: partial.clientX,
    clientY: partial.clientY,
    preventDefault: vi.fn(),
  } as unknown as PointerEvent;
}

describe("tapOnlyHandlers", () => {
  it("fires onTap for a stationary tap", () => {
    const onTap = vi.fn();
    const h = tapOnlyHandlers(onTap);
    h.onPointerDown(ptr({ clientX: 10, clientY: 10 }));
    h.onPointerUp(ptr({ clientX: 10, clientY: 10 }));
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it("does not fire onTap when pointer moves beyond threshold", () => {
    const onTap = vi.fn();
    const h = tapOnlyHandlers(onTap);
    h.onPointerDown(ptr({ clientX: 10, clientY: 10 }));
    h.onPointerMove(ptr({ clientX: 40, clientY: 10 }));
    h.onPointerUp(ptr({ clientX: 40, clientY: 10 }));
    expect(onTap).not.toHaveBeenCalled();
  });

  it("ignores non-primary button and pointer cancel", () => {
    const onTap = vi.fn();
    const h = tapOnlyHandlers(onTap);
    h.onPointerDown({ ...ptr({ clientX: 1, clientY: 1 }), button: 2 } as PointerEvent);
    h.onPointerCancel();
    h.onPointerUp(ptr({ clientX: 1, clientY: 1 }));
    expect(onTap).not.toHaveBeenCalled();
  });

  it("ignores move and up from a different pointer", () => {
    const onTap = vi.fn();
    const h = tapOnlyHandlers(onTap);
    h.onPointerDown(ptr({ clientX: 10, clientY: 10, pointerId: 1 }));
    h.onPointerMove(ptr({ clientX: 50, clientY: 10, pointerId: 2 }));
    h.onPointerUp(ptr({ clientX: 10, clientY: 10, pointerId: 2 }));
    expect(onTap).not.toHaveBeenCalled();
  });

  it("onClick always prevents default", () => {
    const onTap = vi.fn();
    const h = tapOnlyHandlers(onTap);
    const ev = { preventDefault: vi.fn() } as unknown as import("react").MouseEvent;
    h.onClick(ev);
    expect(ev.preventDefault).toHaveBeenCalled();
  });
});
