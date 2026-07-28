"use client";

import { useEffect, useRef, useState } from "react";
import {
  ShareNetworkIcon,
  FacebookLogoIcon,
  XLogoIcon,
  WhatsappLogoIcon,
  LinkIcon,
  CheckIcon,
} from "@phosphor-icons/react";

/**
 * Share a destination or product to social. Prefers the native share sheet
 * (covers Facebook, Messenger, WhatsApp, etc. for free on mobile); falls back
 * to a small menu of direct share links + copy-to-clipboard on desktop
 * browsers that don't implement the Web Share API.
 */
export default function ShareButton({
  title,
  text,
  path,
  variant = "icon",
  className,
}: {
  title: string;
  text?: string;
  /** Site-relative path, e.g. "/destinations/3" */
  path: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  function url() {
    return typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  }

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (canNativeShare) {
      try {
        await navigator.share({ title, text, url: url() });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    setOpen((o) => !o);
  }

  async function copyLink(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  const encodedUrl = encodeURIComponent(url());
  const encodedText = encodeURIComponent(text ?? title);

  const links = [
    { label: "Facebook", icon: <FacebookLogoIcon size={16} weight="fill" />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "X", icon: <XLogoIcon size={16} weight="fill" />, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}` },
    { label: "WhatsApp", icon: <WhatsappLogoIcon size={16} weight="fill" />, href: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
  ];

  return (
    <div className={className}>
      <div ref={menuRef} className="relative inline-block">
        {variant === "icon" ? (
          <button
            type="button"
            onClick={handleClick}
            aria-label="Share"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65"
          >
            <ShareNetworkIcon size={15} weight="bold" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            className="btn btn-outline"
          >
            <ShareNetworkIcon size={15} weight="bold" /> Share
          </button>
        )}

        {open && !canNativeShare && (
          <div
            className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-btn border border-line bg-white p-1.5 shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-semibold text-ink-700 hover:bg-ink-100"
                onClick={() => setOpen(false)}
              >
                {l.icon} {l.label}
              </a>
            ))}
            <button
              type="button"
              onClick={copyLink}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-semibold text-ink-700 hover:bg-ink-100"
            >
              {copied ? <CheckIcon size={16} weight="bold" className="text-ok" /> : <LinkIcon size={16} weight="bold" />}
              {copied ? "Link copied" : "Copy link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
