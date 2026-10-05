"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { XIcon, SealCheckIcon, ArrowRightIcon, BasketIcon } from "@phosphor-icons/react";
import EpassyarMark from "./EpassyarMark";

const SEEN_KEY = "epassyar_welcome_seen";

/** Greets first-time visitors once per browser session, then gets out of the way. */
export default function WelcomeModal({
  municipalityName,
  tagline,
  photoUrl,
  heading,
  message,
}: {
  municipalityName: string;
  tagline?: string | null;
  photoUrl?: string | null;
  heading?: string | null;
  message?: string | null;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY)) return;
    const t = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", onEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    sessionStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to ePassyar"
    >
      <div
        className="reveal relative w-full max-w-md overflow-hidden rounded-card border border-line bg-white shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-ink-700 shadow-sm transition-colors hover:bg-white"
        >
          <XIcon size={16} weight="bold" />
        </button>

        <div
          className={`relative px-6 pb-8 pt-7 text-white ${photoUrl ? "bg-cover bg-center" : "bg-canopy"}`}
          style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}
        >
          {photoUrl && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
          )}
          <div className="relative">
            <EpassyarMark size={40} tone="reversed" />
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] backdrop-blur-sm">
              <SealCheckIcon size={13} weight="fill" /> {municipalityName} · La Union
            </span>
            {heading ? (
              <h2 className="mt-3 font-display text-xl font-extrabold leading-tight">{heading}</h2>
            ) : (
              <h2 className="mt-3 font-display text-xl font-extrabold leading-tight">
                Maligayang pagdating!
                <br />
                Welcome to ePassyar
              </h2>
            )}
            {tagline && <p className="mt-1.5 text-[13px] text-white/85">{tagline}</p>}
          </div>
        </div>

        <div className="p-6">
          <p className="text-[13.5px] leading-relaxed text-ink-600">
            {message ??
              `Plan your visit to ${municipalityName}, reserve guided tours to waterfalls, caves and viewdecks, and bring home local products — all in one place.`}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link href="/build" onClick={dismiss} className="btn btn-amber w-full justify-center">
              Plan a Visit <ArrowRightIcon size={15} weight="bold" />
            </Link>
            <Link href="/products" onClick={dismiss} className="btn btn-outline w-full justify-center">
              <BasketIcon size={16} weight="duotone" /> Browse Local Products
            </Link>
          </div>
          <button
            onClick={dismiss}
            className="mt-3 w-full text-center text-[12.5px] font-semibold text-ink-500 hover:text-ink-700"
          >
            I&apos;ll just look around
          </button>
        </div>
      </div>
    </div>
  );
}
