import { isMediaUrl } from "@/lib/format";

/** Small shared building blocks for admin forms (server-component friendly). */

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-brand-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-600">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-btn border border-line px-3 py-2 text-sm ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-btn border border-line px-3 py-2 text-sm ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-btn border border-line bg-white px-3 py-2 text-sm ${props.className ?? ""}`} />;
}

export function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-white p-5 shadow-card">
      <h2 className="mb-3 font-display text-[15px] font-bold">{title}</h2>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

export function CurrentPhoto({ src }: { src?: string | null }) {
  if (!isMediaUrl(src)) return null;
  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Current photo" className="h-16 w-24 rounded-lg object-cover" />
      <span className="text-xs text-ink-600">Current photo — choose a new file to replace it.</span>
    </div>
  );
}
