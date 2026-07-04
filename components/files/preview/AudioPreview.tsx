"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, Repeat, Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  fileId: string;
}

export default function AudioPreview({ fileId }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const src = `/api/files/${fileId}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (!isLooping) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isLooping]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const value = parseFloat(e.target.value);
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const value = parseFloat(e.target.value);
    audioRef.current.volume = value;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    audioRef.current.muted = nextMute;
    setIsMuted(nextMute);
  };

  const toggleLoop = () => {
    if (!audioRef.current) return;
    audioRef.current.loop = !isLooping;
    setIsLooping(!isLooping);
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 sm:p-12 bg-ink-950/20">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Album Art & Wave Visualizer Card */}
      <div className="card relative flex w-full max-w-sm flex-col items-center justify-center p-8 bg-ink-900/60 shadow-glow-accent">
        
        {/* Glowing Ambient Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-accent-500/10 to-coral-500/10 opacity-30 blur-2xl z-0" />

        {/* Vinyl Disc Container */}
        <div className="relative z-10 flex h-36 w-36 items-center justify-center rounded-full bg-ink-950 border border-white/10 ring-8 ring-white/[0.02] shadow-soft-lg">
          {/* Vinyl Disc Grooves */}
          <div className="absolute inset-2 rounded-full border border-dashed border-white/[0.04] animate-spin [animation-duration:12s]" style={{ animationPlayState: isPlaying ? "running" : "paused" }} />
          <div className="absolute inset-6 rounded-full border border-white/[0.03]" />
          <div className="absolute inset-10 rounded-full border border-dashed border-white/[0.04]" />
          
          {/* Spinning Label */}
          <div 
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-accent-600 to-coral-500 text-white shadow-soft transition-transform duration-[15s] linear infinite",
              isPlaying ? "animate-spin" : ""
            )}
          >
            <Music className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Audio Wave Visualizer Animation */}
        <div className="relative z-10 mt-8 flex h-8 items-end justify-center gap-1 w-full px-6">
          {Array.from({ length: 15 }).map((_, idx) => {
            // Generate some random animations delays and heights
            const delay = `${(idx * 0.1).toFixed(1)}s`;
            const duration = `${(0.6 + Math.random() * 0.8).toFixed(2)}s`;
            return (
              <div
                key={idx}
                className={cn(
                  "w-1 rounded-t-full bg-accent-400 transition-all duration-300",
                  isPlaying ? "animate-[pulse-soft_1s_infinite]" : "h-1 bg-ink-600"
                )}
                style={{
                  height: isPlaying ? "100%" : "4px",
                  animationDelay: delay,
                  animationDuration: duration,
                  opacity: isPlaying ? 0.4 + (idx % 3) * 0.2 : 0.4
                }}
              />
            );
          })}
        </div>

        {/* Control Interface */}
        <div className="relative z-10 mt-8 w-full">
          {/* Progress Seek Bar */}
          <div className="flex flex-col gap-1.5 w-full">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/[0.08] outline-none accent-accent-400 transition-all focus:outline-none"
              style={{
                background: `linear-gradient(to right, #7C5CFF 0%, #7C5CFF ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.08) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.08) 100%)`,
              }}
            />
            <div className="flex items-center justify-between text-2xs font-medium text-ink-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={toggleLoop}
              className={cn(
                "rounded-full p-2 transition-colors hover:bg-white/[0.06]",
                isLooping ? "text-accent-400" : "text-ink-400 hover:text-white"
              )}
              title="Repeat"
            >
              <Repeat className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime = 0;
              }}
              className="rounded-full p-2 text-ink-400 hover:bg-white/[0.06] hover:text-white"
              title="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-500 text-white shadow-glow-accent transition-transform duration-200 hover:scale-105 active:scale-95"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-white text-white" />
              ) : (
                <Play className="h-5 w-5 fill-white text-white translate-x-0.5" />
              )}
            </button>

            {/* Mute Button */}
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-full p-2 text-ink-400 hover:bg-white/[0.06] hover:text-white"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-coral-400" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            {/* Volume Slider */}
            <div className="flex items-center gap-1 w-20">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/[0.08] outline-none accent-accent-400"
                style={{
                  background: `linear-gradient(to right, #7C5CFF 0%, #7C5CFF ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.08) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.08) 100%)`,
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
