"use client";

import { useEffect, useRef } from "react";
import { XIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

type Img = { imageUrl: string; caption?: string | null };

/** Full-screen browsable image viewer: arrows, swipe, keyboard, dots. */
export default function Lightbox({
  images,
  index,
  onClose,
  onIndex,
}: {
  images: Img[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const touchX = useRef<number | null>(null);
  const n = images.length;

  const prev = () => onIndex((index - 1 + n) % n);
  const next = () => onIndex((index + 1) % n);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 45) (dx < 0 ? next : prev)();
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white/90">
        <span className="text-sm font-semibold">{index + 1} / {n}</span>
        <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25">
          <XIcon size={18} weight="bold" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-2 pb-4" onClick={(e) => e.stopPropagation()}>
        {n > 1 && (
          <button onClick={prev} aria-label="Previous" className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
            <CaretLeftIcon size={22} weight="bold" />
          </button>
        )}
        <figure className="max-h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[index].imageUrl} alt={images[index].caption ?? `Photo ${index + 1}`} className="mx-auto max-h-[78vh] max-w-full rounded-lg object-contain" />
          {images[index].caption && (
            <figcaption className="mt-2 text-center text-sm text-white/80">{images[index].caption}</figcaption>
          )}
        </figure>
        {n > 1 && (
          <button onClick={next} aria-label="Next" className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
            <CaretRightIcon size={22} weight="bold" />
          </button>
        )}
      </div>

      {n > 1 && (
        <div className="flex justify-center gap-1.5 pb-4" onClick={(e) => e.stopPropagation()}>
          {images.map((_, i) => (
            <button key={i} aria-label={`Photo ${i + 1}`} onClick={() => onIndex(i)} className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-2 bg-white/50"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
