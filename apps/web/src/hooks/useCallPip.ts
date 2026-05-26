/**
 * useCallPip — picture-in-picture drag + resize logic for CallModal.
 * Encapsulates all mouse/touch event management so CallModal stays clean.
 */

import { useState, useCallback, useEffect } from "react";

interface Position { x: number; y: number }
interface Size { width: number; height: number }

const DEFAULT_SIZE: Size = { width: 128, height: 96 };
const DEFAULT_POS: Position = { x: 16, y: 64 };
const MARGIN = 16;

export function useCallPip() {
  const [position, setPosition] = useState<Position>(DEFAULT_POS);
  const [size, setSize] = useState<Size>(DEFAULT_SIZE);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<Position>({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState<Size>(DEFAULT_SIZE);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function snapToEdge(pos: Position, containerRect: DOMRect, pipSize: Size): Position {
    const centerX = pos.x + pipSize.width / 2;
    const x = centerX < containerRect.width / 2
      ? MARGIN
      : containerRect.width - pipSize.width - MARGIN;
    const y = Math.max(MARGIN, Math.min(pos.y, containerRect.height - pipSize.height - MARGIN));
    return { x, y };
  }

  function getContainerRect(): DOMRect | null {
    return document.querySelector(".call-container")?.getBoundingClientRect() ?? null;
  }

  // ── Drag ──────────────────────────────────────────────────────────────────

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const rect = (e.target as HTMLElement).closest(".pip-container")?.getBoundingClientRect();

    if (rect) {
      setDragOffset({ x: clientX - rect.left, y: clientY - rect.top });
    }
  }, []);

  const onDragMove = useCallback((clientX: number, clientY: number) => {
    const containerRect = getContainerRect();
    if (!containerRect) return;

    let newX = clientX - containerRect.left - dragOffset.x;
    let newY = clientY - containerRect.top - dragOffset.y;
    newX = Math.max(0, Math.min(newX, containerRect.width - size.width));
    newY = Math.max(0, Math.min(newY, containerRect.height - size.height));
    setPosition({ x: newX, y: newY });
  }, [dragOffset, size]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    const containerRect = getContainerRect();
    if (containerRect) {
      setPosition((prev) => snapToEdge(prev, containerRect, size));
    }
  }, [size]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => { e.preventDefault(); onDragMove(e.clientX, e.clientY); };
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); onDragMove(e.touches[0].clientX, e.touches[0].clientY); };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", endDrag);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", endDrag);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", endDrag);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, onDragMove, endDrag]);

  // ── Resize ─────────────────────────────────────────────────────────────────

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY });
    setInitialSize({ ...size });
  }, [size]);

  const onResizeMove = useCallback((e: MouseEvent) => {
    e.preventDefault();
    const delta = Math.max(e.clientX - resizeStart.x, e.clientY - resizeStart.y);
    const newWidth = Math.max(80, Math.min(320, initialSize.width + delta));
    const newHeight = Math.max(60, Math.min(240, (newWidth * 3) / 4));

    const containerRect = getContainerRect();
    if (containerRect) {
      setPosition((prev) => ({
        x: Math.min(prev.x, containerRect.width - newWidth),
        y: Math.min(prev.y, containerRect.height - newHeight),
      }));
    }
    setSize({ width: newWidth, height: newHeight });
  }, [resizeStart, initialSize]);

  const endResize = useCallback(() => setIsResizing(false), []);

  useEffect(() => {
    if (!isResizing) return;

    document.addEventListener("mousemove", onResizeMove);
    document.addEventListener("mouseup", endResize);
    document.body.style.cursor = "nw-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", onResizeMove);
      document.removeEventListener("mouseup", endResize);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, onResizeMove, endResize]);

  return { position, size, startDrag, startResize };
}
