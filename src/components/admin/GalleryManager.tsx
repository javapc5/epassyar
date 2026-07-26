"use client";

import { useEffect, useState } from "react";
import { TrashIcon, ImagesIcon } from "@phosphor-icons/react";
import ImageCropUpload from "./ImageCropUpload";

type Img = { id: number; imageUrl: string; caption: string | null };

/** Admin gallery editor: up to 10 photos per destination / guide / homestay. */
export default function GalleryManager({ entityType, entityId }: { entityType: string; entityId: number }) {
  const [images, setImages] = useState<Img[]>([]);
  const [max, setMax] = useState(10);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/gallery?entityType=${entityType}&entityId=${entityId}`)
      .then((r) => r.json())
      .then((d) => { setImages(d.images ?? []); setMax(d.max ?? 10); setLoaded(true); });
  }, [entityType, entityId]);

  async function addImage(url: string) {
    setError("");
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entityType, entityId, imageUrl: url }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Could not add photo.");
    setImages((imgs) => [...imgs, data.image]);
  }

  async function removeImage(id: number) {
    await fetch(`/api/admin/gallery?id=${id}`, { method: "DELETE" });
    setImages((imgs) => imgs.filter((i) => i.id !== id));
  }

  if (!loaded) return <p className="text-sm text-ink-600">Loading gallery…</p>;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-600">
        <ImagesIcon size={18} weight="duotone" className="text-brand-700" />
        {images.length} of {max} photos
      </div>

      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((img) => (
            <div key={img.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imageUrl} alt={img.caption ?? ""} className="h-20 w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-90 hover:bg-danger"
                title="Remove photo"
              >
                <TrashIcon size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < max ? (
        <ImageCropUpload mode="wide" onUploaded={addImage} buttonLabel="Add gallery photo" />
      ) : (
        <p className="text-xs font-semibold text-warn">Maximum of {max} photos reached — remove one to add another.</p>
      )}

      {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-danger">{error}</div>}
    </div>
  );
}
