"use client";

import { useEffect, useRef, useState } from "react";

export type HeroSlide = { url: string; caption?: string | null; mediaType?: "image" | "video" };

/**
 * Background media carousel for the home hero — supports photos AND videos.
 * Auto-rotates with an admin-configurable transition (fade / slide / zoom),
 * timing and per-slide captions. Swipe (touch) and dot navigation supported.
 * If no slides are provided, the parent shows the SVG fallback instead.
 */
export default function HeroCarousel({
  slides,
  intervalMs = 5000,
  transition = "fade",
  transitionMs = 700,
  captionsEnabled = true,
}: {
  slides: HeroSlide[];
  intervalMs?: number;
  transition?: "fade" | "slide" | "zoom";
  transitionMs?: number;
  captionsEnabled?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const touchX = useRef<number | null>(null);
  const paused = useRef(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      if (!paused.current) setIdx((i) => (i + 1) % slides.length);
    }, Math.max(2000, intervalMs));
    return () => clearInterval(t);
  }, [slides.length, intervalMs]);

  // Play only the active video; rewind + pause the rest to save resources.
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === idx) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [idx, slides.length]);

  function go(delta: number) {
    setIdx((i) => (i + delta + slides.length) % slides.length);
  }
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
    paused.current = true;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
    paused.current = false;
  }

  const isSlide = transition === "slide";
  const dur = `${transitionMs}ms`;
  const active = slides[idx];

  return (
    <div className="absolute inset-0 overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {isSlide ? (
        // ---- SLIDE: a horizontal track that translates ----
        <div
          className="flex h-full w-full"
          style={{ transform: `translateX(-${idx * 100}%)`, transition: `transform ${dur} cubic-bezier(.16,1,.3,1)` }}
        >
          {slides.map((s, i) => (
            <div key={i} className="relative h-full w-full shrink-0 basis-full">
              <Media s={s} i={i} active={i === idx} zoom={false} refCb={(el) => (videoRefs.current[i] = el)} />
            </div>
          ))}
        </div>
      ) : (
        // ---- FADE / ZOOM: stacked layers cross-fading ----
        slides.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{ opacity: i === idx ? 1 : 0, transition: `opacity ${dur} ease-in-out` }}
          >
            <Media s={s} i={i} active={i === idx} zoom={transition === "zoom"} refCb={(el) => (videoRefs.current[i] = el)} />
          </div>
        ))
      )}

      {/* light gradient — keeps hero text readable while letting the media show */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

      {/* per-slide caption */}
      {captionsEnabled && active?.caption ? (
        <div
          key={idx}
          className="reveal absolute bottom-9 left-1/2 z-10 w-[92%] max-w-wrap -translate-x-1/2 px-1 text-white sm:bottom-10"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3.5 py-1.5 text-[13px] font-semibold backdrop-blur-sm sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-cta-500" />
            {active.caption}
          </span>
        </div>
      ) : null}

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Show banner ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-2 bg-white/60"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Media({
  s,
  i,
  active,
  zoom,
  refCb,
}: {
  s: HeroSlide;
  i: number;
  active: boolean;
  zoom: boolean;
  refCb: (el: HTMLVideoElement | null) => void;
}) {
  const zoomClass = zoom && active ? "animate-ken-burns" : "";
  if (s.mediaType === "video") {
    return (
      <video
        ref={refCb}
        src={s.url}
        className={`h-full w-full object-cover ${zoomClass}`}
        muted
        loop
        playsInline
        autoPlay={active}
        preload="metadata"
        aria-hidden="true"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={s.url} alt={s.caption ?? ""} className={`h-full w-full object-cover ${zoomClass}`} />
  );
}
