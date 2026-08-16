"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Headphones, Pause, Play, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NARRATION_ROOT_ID } from "@/lib/tts-text";
import {
  alignWords,
  findWordIndex,
  wrapWords,
  type TimingWord,
} from "@/lib/audio-sync";

interface AudioPlayerProps {
  slug: string;
}

type AvailabilityState = "idle" | "checking" | "ready" | "unavailable" | "error";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const PROBE_TIMEOUT_MS = 6000;
const SCROLL_SUPPRESS_MS = 2000;
const AUTO_SCROLL_MIN = 0.15;
const AUTO_SCROLL_MAX = 0.75;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export function AudioPlayer({ slug }: AudioPlayerProps) {
  const base = process.env.NEXT_PUBLIC_AUDIO_BASE_URL;

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<AvailabilityState>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timingRef = useRef<TimingWord[] | null>(null);
  const alignmentRef = useRef<Int32Array | null>(null);
  const spansRef = useRef<HTMLSpanElement[]>([]);
  const activeSpanRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastManualScrollRef = useRef(0);
  const hasProbedRef = useRef(false);

  const mp3Url = base ? `${base}/${slug}.mp3` : null;
  const jsonUrl = base ? `${base}/${slug}.json` : null;

  useEffect(() => {
    const onManualScroll = () => {
      lastManualScrollRef.current = Date.now();
    };
    window.addEventListener("wheel", onManualScroll, { passive: true });
    window.addEventListener("touchmove", onManualScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onManualScroll);
      window.removeEventListener("touchmove", onManualScroll);
    };
  }, []);

  useEffect(() => {
    if (!open || hasProbedRef.current) return;
    hasProbedRef.current = true;

    if (!base || !mp3Url) {
      setState("unavailable");
      return;
    }

    setState("checking");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    fetch(mp3Url, { method: "HEAD", signal: controller.signal })
      .then((res) => {
        setState(res.ok ? "ready" : "unavailable");
      })
      .catch(() => {
        setState("error");
      })
      .finally(() => {
        clearTimeout(timeout);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [open, mp3Url, base]);

  useEffect(() => {
    if (state !== "ready" || !jsonUrl) return;

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error("timing fetch failed");
        return res.json();
      })
      .then((data) => {
        if (!data || !Array.isArray(data.words)) {
          throw new Error("malformed timing payload");
        }
        const words: TimingWord[] = data.words;
        const root = document.getElementById(NARRATION_ROOT_ID);
        if (!root) return;

        const { spans, tokens } = wrapWords(root);
        const alignment = alignWords(tokens, words);
        if (!alignment) return;

        timingRef.current = words;
        alignmentRef.current = alignment;
        spansRef.current = spans;
      })
      .catch(() => {
        timingRef.current = null;
        alignmentRef.current = null;
      });
  }, [state, jsonUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    const tick = () => {
      const words = timingRef.current;
      const alignment = alignmentRef.current;
      const spans = spansRef.current;

      if (words && alignment && spans.length > 0) {
        const ms = audio.currentTime * 1000;
        const wordIdx = findWordIndex(words, ms);
        const spanIdx = wordIdx >= 0 ? alignment[wordIdx] : -1;
        const nextSpan = spanIdx >= 0 ? spans[spanIdx] : null;

        if (nextSpan !== activeSpanRef.current) {
          activeSpanRef.current?.classList.remove("tts-active-word");
          nextSpan?.classList.add("tts-active-word");
          activeSpanRef.current = nextSpan;

          if (nextSpan && Date.now() - lastManualScrollRef.current > SCROLL_SUPPRESS_MS) {
            const rect = nextSpan.getBoundingClientRect();
            const vh = window.innerHeight;
            if (rect.top < vh * AUTO_SCROLL_MIN || rect.bottom > vh * AUTO_SCROLL_MAX) {
              nextSpan.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  const clearHighlight = () => {
    activeSpanRef.current?.classList.remove("tts-active-word");
    activeSpanRef.current = null;
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  };

  const cycleSpeed = () => {
    const nextIndex = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(nextIndex);
    if (audioRef.current) {
      audioRef.current.playbackRate = SPEEDS[nextIndex];
    }
  };

  const handleClose = () => {
    audioRef.current?.pause();
    clearHighlight();
    setOpen(false);
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrentTime(audio.currentTime);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Listen to this article"
        onClick={() => setOpen((v) => !v)}
        className="text-sm sm:text-base font-medium flex items-center gap-1 p-0 m-0 hover:opacity-70 transition-opacity"
      >
        <Headphones className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Audio player"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-lg print:hidden max-w-[90vw]"
        >
          {state === "unavailable" ? (
            <p className="text-sm text-muted-foreground">
              Audio narration for this article isn&apos;t available yet.
            </p>
          ) : state === "error" ? (
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t connect to the audio service. Try again later.
            </p>
          ) : state === "checking" || state === "idle" ? (
            <p className="text-sm text-muted-foreground">Checking for audio…</p>
          ) : mp3Url ? (
            <>
              <audio
                ref={audioRef}
                src={mp3Url}
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  setIsPlaying(false);
                  clearHighlight();
                }}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <input
                type="range"
                aria-label="Seek"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-24 sm:w-40"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Playback speed"
                onClick={cycleSpeed}
                className="h-8 px-2 text-xs tabular-nums"
              >
                {SPEEDS[speedIndex]}x
              </Button>
            </>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", state === "checking" && "opacity-50")}
            aria-label="Close player"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </>
  );
}
