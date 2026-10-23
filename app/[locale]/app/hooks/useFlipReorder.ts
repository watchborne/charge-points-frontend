import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * FLIP reorder animation: items whose position changed glide to the new one
 * (Web Animations API). Keyed by a stable id, so it survives remounting under
 * another parent. No-op without WAAPI or with reduced motion.
 */
export const useFlipReorder = () => {
  const itemsRef = useRef(new Map<string, HTMLElement>());
  const positionsRef = useRef(new Map<string, DOMRect>());

  const registerFlipItem = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      if (node) {
        itemsRef.current.set(id, node);
      } else if (itemsRef.current.get(id)?.isConnected === false) {
        itemsRef.current.delete(id);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    const previousPositions = positionsRef.current;
    const nextPositions = new Map<string, DOMRect>();

    itemsRef.current.forEach((node, id) => {
      if (!node.isConnected) {
        itemsRef.current.delete(id);
        return;
      }
      nextPositions.set(id, node.getBoundingClientRect());
    });

    positionsRef.current = nextPositions;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    itemsRef.current.forEach((node, id) => {
      if (typeof node.animate !== "function") return;

      const before = previousPositions.get(id);
      const after = nextPositions.get(id);
      if (!before || !after) return;

      const deltaX = before.left - after.left;
      const deltaY = before.top - after.top;
      if (deltaX === 0 && deltaY === 0) return;

      node.animate(
        [{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: "translate(0, 0)" }],
        { duration: 300, easing: "cubic-bezier(0.2, 0, 0, 1)" },
      );
    });
  });

  return { registerFlipItem };
};
