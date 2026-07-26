"use client";

import { useRef, useState } from "react";
import { FilmSlateIcon, ArrowCounterClockwiseIcon, CheckCircleIcon } from "@phosphor-icons/react";

/**
 * Direct video uploader for the hero banner (no cropping — video keeps its
 * native frame). Previews the clip before saving, then uploads to
 * /api/admin/upload and calls onUploaded with the stored /uploads/ path.
 */
export default function VideoUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError("");
    if (f.size > 40 * 1024 * 1024) return setError("Video is too large (max 40 MB). Compress it or trim it shorter.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function confirm() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      onUploaded(data.url);
      setFile(null);
      setPreview(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-card border border-line bg-bg p-3">
      {!file ? (
        <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-outline">
          <FilmSlateIcon size={16} weight="bold" /> Add banner video
        </button>
      ) : (
        <div>
          {preview && (
            <video
              src={preview}
              className="h-48 w-full rounded-lg bg-black object-contain"
              controls
              muted
              playsInline
            />
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={confirm} disabled={busy} className="btn btn-green disabled:opacity-60">
              <CheckCircleIcon size={16} weight="fill" /> {busy ? "Uploading…" : "Looks good — save video"}
            </button>
            <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="btn btn-outline">
              <ArrowCounterClockwiseIcon size={15} /> Cancel
            </button>
          </div>
        </div>
      )}
      {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-danger">{error}</div>}
      <input ref={fileRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={pick} />
    </div>
  );
}
