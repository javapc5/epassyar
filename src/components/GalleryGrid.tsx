"use client";

import { useState } from "react";
import Lightbox from "./Lightbox";

type Img = { imageUrl: string; caption?: string | null };

/**
 * Minimalist browsable photo grid. First photo is featured larger; tapping any
 * thumbnail opens the full-screen Lightbox to browse the whole collection.
 */
export default function GalleryGrid({ images }: { images: Img[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  function show(i: number) {
    setIndex(i);
    setOpen(true);
  }

  return (
    <>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => show(i)}
            aria-label={`Open photo ${i + 1}`}
            className={`group relative overflow-hidden rounded-card shadow-card ${i === 0 ? "col-span-2 row-span-2" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.imageUrl}
              alt={img.caption ?? `Photo ${i + 1}`}
              className={`w-full object-cover transition group-hover:scale-105 ${i === 0 ? "h-full min-h-[180px]" : "h-28"}`}
            />
            <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
          </button>
        ))}
      </div>
      {open && <Lightbox images={images} index={index} onClose={() => setOpen(false)} onIndex={setIndex} />}
    </>
  );
}
