"use client";

import { useRef, useEffect, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  fileId: string;
}

export default function VideoPreview({ fileId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const src = `/api/files/${fileId}`;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const video = videoRef.current;
      if (!video) return;

      // Don't intercept if user is typing in an input (though shouldn't happen inside modal)
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ": // Space bar
          e.preventDefault();
          if (video.paused) {
            void video.play();
          } else {
            video.pause();
          }
          break;
        case "arrowleft": // Left Arrow (seek -5s)
          e.preventDefault();
          video.currentTime = Math.max(video.currentTime - 5, 0);
          break;
        case "arrowright": // Right Arrow (seek +5s)
          e.preventDefault();
          video.currentTime = Math.min(video.currentTime + 5, video.duration || 0);
          break;
        case "arrowup": // Up Arrow (volume +10%)
          e.preventDefault();
          video.volume = Math.min(video.volume + 0.1, 1);
          break;
        case "arrowdown": // Down Arrow (volume -10%)
          e.preventDefault();
          video.volume = Math.max(video.volume - 0.1, 0);
          break;
        case "m": // M key (toggle mute)
          e.preventDefault();
          video.muted = !video.muted;
          break;
        case "f": // F key (toggle fullscreen)
          e.preventDefault();
          if (document.fullscreenElement) {
            void document.exitFullscreen();
          } else {
            void video.requestFullscreen();
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const handlePlayStateChange = () => {
    const video = videoRef.current;
    if (!video) return;
    setShowPlayOverlay(video.paused);
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black/60 p-4">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60 z-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent-400" />
        </div>
      )}

      <div className="relative group w-full max-w-4xl rounded-2xl overflow-hidden border border-white/[0.08] shadow-glow-accent bg-black transition-all">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src={src}
          controls
          className="w-full max-h-[70vh] object-contain cursor-pointer"
          onLoadStart={() => setLoading(true)}
          onCanPlay={() => setLoading(false)}
          onClick={handleVideoClick}
          onPlay={handlePlayStateChange}
          onPause={handlePlayStateChange}
        />

        {/* Play Overlay (appears momentarily on pause) */}
        {showPlayOverlay && (
          <div 
            onClick={handleVideoClick}
            className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-auto cursor-pointer animate-fade-in"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/90 text-white shadow-glow-accent transition-transform scale-100 hover:scale-105">
              <Play className="h-6 w-6 fill-white text-white translate-x-0.5" />
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Hint Bar (appears on hover) */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 flex items-center gap-4 rounded-full bg-ink-950/80 px-4 py-1.5 text-2xs text-ink-300 backdrop-blur-md">
          <span><kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">Space</kbd> Play/Pause</span>
          <span><kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">← / →</kbd> Seek</span>
          <span><kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">↑ / ↓</kbd> Vol</span>
          <span><kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">F</kbd> Fullscreen</span>
        </div>
      </div>
    </div>
  );
}
