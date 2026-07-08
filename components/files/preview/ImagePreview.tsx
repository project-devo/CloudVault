"use client";

import { useState, useRef, MouseEvent, TouchEvent } from "react";
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  fileId: string;
  shareId?: string;
  sharePassword?: string;
}

export default function ImagePreview({ fileId, shareId, sharePassword }: Props) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const src = shareId
    ? `/api/shares/${shareId}/file?fileId=${fileId}`
    : `/api/files/${fileId}`;

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const rotate = () => setRotation((prev) => (prev + 90) % 360);
  
  const reset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (scale <= 1) return; // Only pan when zoomed in
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile
  const handleTouchStart = (e: TouchEvent) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.current.x,
      y: touch.clientY - dragStart.current.y,
    });
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-ink-950/20 select-none">
      {/* Transparency Checkerboard Background Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #181826 25%, transparent 25%),
            linear-gradient(-45deg, #181826 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #181826 75%),
            linear-gradient(-45deg, transparent 75%, #181826 75%)
          `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
        }}
      />

      {/* Main Image Container */}
      <div
        className={cn(
          "relative flex flex-1 items-center justify-center p-4 cursor-grab z-10",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/40 backdrop-blur-xs z-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent-400" />
          </div>
        )}
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={src}
            alt="Preview"
            className="pointer-events-none max-h-[70vh] max-w-full rounded shadow-soft-lg object-contain transition-opacity duration-300"
            style={{ opacity: loading ? 0 : 1 }}
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-900/90 px-3 py-1.5 shadow-soft-lg backdrop-blur-xl">
        <button
          type="button"
          onClick={zoomOut}
          disabled={scale <= 0.5}
          className="rounded-full p-2 text-ink-300 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="min-w-[3rem] text-center text-xs font-semibold text-ink-200">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={zoomIn}
          disabled={scale >= 4}
          className="rounded-full p-2 text-ink-300 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <div className="h-4 w-px bg-white/10 mx-1" />
        <button
          type="button"
          onClick={rotate}
          className="rounded-full p-2 text-ink-300 hover:bg-white/[0.06] hover:text-white"
          title="Rotate"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-full p-2 text-ink-300 hover:bg-white/[0.06] hover:text-white"
          title="Reset View"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
