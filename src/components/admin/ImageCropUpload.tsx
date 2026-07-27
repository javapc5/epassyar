"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { UploadSimpleIcon, CheckCircleIcon, ArrowCounterClockwiseIcon, DeviceMobileIcon, MonitorIcon } from "@phosphor-icons/react";

/**
 * Photo picker with crop/zoom editing and desktop + mobile previews BEFORE the
 * image is saved. Works with mouse (desktop) and touch (mobile). On confirm it
 * uploads the cropped result to /api/admin/upload and either:
 *  - writes the stored path into a hidden input (`name`) for server-action forms, or
 *  - calls `onUploaded(url)` when used programmatically (e.g. gallery manager).
 *
 * mode:
 *  - "wide"   16:10 — destination/package/homestay cover photos (JPEG)
 *  - "square" 1:1   — guide profile photos (JPEG)
 *  - "qr"     1:1   — GCash QR: PNG output (keeps modules sharp) + scan preview
 */
export default function ImageCropUpload({
  name,
  mode = "wide",
  initial,
  onUploaded,
  buttonLabel,
}: {
  name?: string;
  mode?: "wide" | "square" | "qr" | "logo" | "portrait";
  initial?: string | null;
  onUploaded?: (url: string) => void;
  buttonLabel?: string;
}) {
  const aspect = mode === "wide" ? 16 / 10 : mode === "portrait" ? 3 / 4 : 1;
  const isQr = mode === "qr";
  const isLogo = mode === "logo";
  const usePng = isQr || isLogo; // preserve transparency for logos and keep QR modules crisp
  const fileRef = useRef<HTMLInputElement>(null);

  const [src, setSrc] = useState<string | null>(null); // image being edited
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [preview, setPreview] = useState<string | null>(null); // cropped, pre-upload
  const [saved, setSaved] = useState<string | null>(initial || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_: Area, pixels: Area) => setAreaPixels(pixels), []);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(String(reader.result));
      setPreview(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(f);
    e.target.value = ""; // allow re-picking the same file
  }

  async function renderCrop(): Promise<Blob> {
    const img = new Image();
    img.src = src!;
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    const a = areaPixels!;
    const maxOut = mode === "wide" ? 1600 : 800;
    const scale = Math.min(1, maxOut / a.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(a.width * scale);
    canvas.height = Math.round(a.height * scale);
    const ctx = canvas.getContext("2d")!;
    // Canvas starts fully transparent; PNG output keeps it (logos), JPEG flattens it (photos).
    ctx.drawImage(img, a.x, a.y, a.width, a.height, 0, 0, canvas.width, canvas.height);
    return new Promise((res) =>
      canvas.toBlob((b) => res(b!), usePng ? "image/png" : "image/jpeg", 0.86),
    );
  }

  async function showPreview() {
    if (!src || !areaPixels) return;
    const blob = await renderCrop();
    setPreview(URL.createObjectURL(blob));
  }

  async function confirmUpload() {
    if (!src || !areaPixels) return;
    setBusy(true);
    setError("");
    try {
      const blob = await renderCrop();
      const fd = new FormData();
      fd.append("file", new File([blob], usePng ? (isLogo ? "logo.png" : "qr.png") : "photo.jpg", { type: blob.type }));
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setSaved(data.url);
      setSrc(null);
      setPreview(null);
      onUploaded?.(data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-card border border-line bg-bg p-3">
      {name && <input type="hidden" name={name} value={saved ?? ""} />}

      {/* current saved image */}
      {saved && !src && (
        <div className="mb-2 flex items-center gap-3">
          {isLogo ? (
            // show the transparent logo on both light and dark, since it appears on both
            <span className="flex gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={saved} alt="Logo on light" className="h-16 w-16 rounded-lg border border-line bg-white object-contain p-1" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={saved} alt="Logo on dark" className="h-16 w-16 rounded-lg border border-line bg-brand-900 object-contain p-1" />
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={saved} alt="Saved" className={`${mode === "wide" ? "h-16 w-[102px] object-cover" : mode === "portrait" ? "h-[84px] w-[63px] object-cover" : "h-16 w-16 object-cover"} rounded-lg border border-line ${isQr ? "object-contain bg-white" : ""}`} />
          )}
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-ok"><CheckCircleIcon size={14} weight="fill" /> Saved — choose a new file to replace it.</span>
        </div>
      )}

      {!src ? (
        <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-outline">
          <UploadSimpleIcon size={16} weight="bold" /> {buttonLabel ?? (saved ? "Replace photo" : "Choose photo")}
        </button>
      ) : (
        <div>
          {/* CROP EDITOR */}
          <div className="relative h-64 w-full overflow-hidden rounded-lg bg-black/80" style={{ touchAction: "none" }}>
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">Zoom</span>
            <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-brand-700" />
          </div>
          <p className="mt-1 text-[11px] text-ink-600">Drag to reposition · pinch or slide to zoom · the frame is exactly how it will appear.</p>

          {/* PRE-SAVE PREVIEWS */}
          {preview && (
            <div className="mt-3 rounded-lg border border-line bg-white p-3">
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-brand-700">Preview before saving</div>
              {isQr ? (
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="QR preview" className="h-28 w-28 rounded-lg border border-line bg-white object-contain" />
                  <div className="text-xs text-ink-600">This is exactly how tourists will see and scan your GCash QR on the payment page. Make sure the whole QR code is inside the frame and sharp.</div>
                </div>
              ) : isLogo ? (
                <div>
                  <div className="flex items-end gap-4">
                    <div>
                      <div className="mb-1 text-[10px] font-bold text-ink-600">ON WHITE HEADER</div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Logo on light" className="h-16 w-16 rounded-lg border border-line bg-white object-contain p-1" />
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] font-bold text-ink-600">ON DARK SIDEBAR</div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Logo on dark" className="h-16 w-16 rounded-lg border border-line bg-brand-900 object-contain p-1" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-ink-600">Transparent PNG logos keep their transparency (no background box). If you see a white/black square behind the logo, your source file isn&apos;t transparent.</div>
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-5">
                  <div>
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-ink-600"><MonitorIcon size={12} /> DESKTOP</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Desktop preview" className={`${mode === "wide" ? "h-[106px] w-[170px]" : mode === "portrait" ? "h-[160px] w-[120px]" : "h-24 w-24 rounded-full"} rounded-lg object-cover shadow-card`} />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-ink-600"><DeviceMobileIcon size={12} /> MOBILE</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Mobile preview" className={`${mode === "wide" ? "h-[75px] w-[120px]" : mode === "portrait" ? "h-[112px] w-[84px]" : "h-14 w-14 rounded-full"} rounded-lg object-cover shadow-card`} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload progress bar */}
          {busy && (
            <div className="mt-3 overflow-hidden rounded-full bg-brand-100">
              <div className="h-1.5 animate-[upload-progress_1.8s_ease-in-out_infinite] rounded-full bg-brand-500" />
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {!preview ? (
              <button type="button" onClick={showPreview} className="btn btn-green">Preview crop</button>
            ) : (
              <button type="button" onClick={confirmUpload} disabled={busy} className="btn btn-green disabled:opacity-60">
                {busy ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Uploading…
                  </>
                ) : (
                  <><CheckCircleIcon size={16} weight="fill" /> Looks good — save photo</>
                )}
              </button>
            )}
            <button type="button" onClick={() => { setSrc(null); setPreview(null); }} disabled={busy} className="btn btn-outline disabled:opacity-50">
              <ArrowCounterClockwiseIcon size={15} /> Cancel
            </button>
          </div>
        </div>
      )}

      {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-danger">{error}</div>}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
    </div>
  );
}
