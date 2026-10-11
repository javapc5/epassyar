"use client";

/**
 * Loads a QR image (an uploaded /api/media/… GCash QR or a generated data-URL
 * tourist pass), redraws it on a white canvas with caption lines beneath it, and
 * triggers a PNG download. The caption is "baked" into the pixels so a second
 * phone scanning the saved image still sees the amount / booking reference — a
 * plain static QR carries none of that on its own.
 */
export async function downloadQrWithCaption(
  src: string,
  filename: string,
  lines: { text: string; big?: boolean }[],
): Promise<void> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not load the QR image."));
  });

  const qr = 640; // QR drawn at a generous size so it scans when reprinted
  const pad = 48; // white quiet-zone around the QR
  const lineH = 48;
  const footer = lines.length * lineH + 24;

  const canvas = document.createElement("canvas");
  canvas.width = qr + pad * 2;
  canvas.height = qr + pad * 2 + footer;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Keep QR modules crisp — no smoothing on the code itself.
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, pad, pad, qr, qr);
  ctx.imageSmoothingEnabled = true;

  ctx.textAlign = "center";
  ctx.fillStyle = "#0E3D12";
  let y = qr + pad * 2 + 8;
  for (const l of lines) {
    y += lineH;
    ctx.font = l.big
      ? "700 38px 'Bricolage Grotesque', Inter, system-ui, sans-serif"
      : "500 26px Inter, system-ui, sans-serif";
    ctx.fillText(l.text, canvas.width / 2, y - 12);
  }

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  a.click();
}
