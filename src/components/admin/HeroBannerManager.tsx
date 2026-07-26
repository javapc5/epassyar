"use client";

import { useEffect, useState } from "react";
import { TrashIcon, ImagesIcon, FilmSlateIcon, CheckIcon, ImageSquareIcon } from "@phosphor-icons/react";
import ImageCropUpload from "./ImageCropUpload";
import VideoUpload from "./VideoUpload";

type Slide = {
  id: number;
  imageUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
};

/**
 * Home-page banner editor: mix of photos and videos, each with its own caption,
 * up to 10 slides. Captions save inline; the public hero shows them per slide.
 */
export default function HeroBannerManager({ entityId = 1 }: { entityId?: number }) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [max, setMax] = useState(10);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savedId, setSavedId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/admin/gallery?entityType=hero&entityId=${entityId}`)
      .then((r) => r.json())
      .then((d) => {
        setSlides(d.images ?? []);
        setMax(d.max ?? 10);
        setDrafts(Object.fromEntries((d.images ?? []).map((s: Slide) => [s.id, s.caption ?? ""])));
        setLoaded(true);
      });
  }, [entityId]);

  async function add(url: string, mediaType: "image" | "video") {
    setError("");
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entityType: "hero", entityId, imageUrl: url, mediaType }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Could not add slide.");
    setSlides((s) => [...s, data.image]);
    setDrafts((d) => ({ ...d, [data.image.id]: "" }));
  }

  async function remove(id: number) {
    await fetch(`/api/admin/gallery?id=${id}`, { method: "DELETE" });
    setSlides((s) => s.filter((i) => i.id !== id));
  }

  async function saveCaption(id: number) {
    const caption = drafts[id] ?? "";
    const res = await fetch("/api/admin/gallery", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, caption }),
    });
    if (res.ok) {
      setSlides((s) => s.map((i) => (i.id === id ? { ...i, caption: caption.trim() || null } : i)));
      setSavedId(id);
      setTimeout(() => setSavedId((v) => (v === id ? null : v)), 1500);
    }
  }

  if (!loaded) return <p className="text-sm text-ink-600">Loading banner…</p>;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-600">
        <ImagesIcon size={18} weight="duotone" className="text-brand-700" />
        {slides.length} of {max} banner slides
      </div>

      {slides.length > 0 && (
        <div className="mb-4 space-y-2.5">
          {slides.map((s, i) => (
            <div key={s.id} className="flex gap-3 rounded-card border border-line bg-white p-2.5">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-black">
                {s.mediaType === "video" ? (
                  <>
                    <video src={s.imageUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                    <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold text-white">
                      <FilmSlateIcon size={9} weight="fill" /> VIDEO
                    </span>
                  </>
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.imageUrl} alt={s.caption ?? ""} className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white">
                      <ImageSquareIcon size={9} weight="fill" /> PHOTO
                    </span>
                  </>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-700">
                  Slide {i + 1} caption
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={drafts[s.id] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                    placeholder="e.g. Tiluniang Falls, Brgy. Cardiz"
                    maxLength={80}
                    className="min-w-0 flex-1 rounded-btn border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => saveCaption(s.id)}
                    className="btn btn-outline shrink-0 px-3 py-1.5"
                    title="Save caption"
                  >
                    {savedId === s.id ? <><CheckIcon size={14} weight="bold" /> Saved</> : "Save"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => remove(s.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full bg-black/5 text-ink-600 hover:bg-danger hover:text-white"
                title="Remove slide"
              >
                <TrashIcon size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {slides.length < max ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <ImageCropUpload mode="wide" onUploaded={(url) => add(url, "image")} buttonLabel="Add banner photo" />
          <VideoUpload onUploaded={(url) => add(url, "video")} />
        </div>
      ) : (
        <p className="text-xs font-semibold text-warn">Maximum of {max} slides reached — remove one to add another.</p>
      )}

      {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-danger">{error}</div>}
    </div>
  );
}
