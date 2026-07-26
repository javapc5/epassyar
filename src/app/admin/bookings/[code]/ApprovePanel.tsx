"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SealCheckIcon, XCircleIcon, StarIcon } from "@phosphor-icons/react";

type Suggestion = { id: number; fullName: string; barangay: string; recentDuties: number; ratingAvg: number; score: number };

export default function ApprovePanel({ code, guidesNeeded, suggestions }: { code: string; guidesNeeded: number; suggestions: Suggestion[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<number[]>(suggestions.slice(0, guidesNeeded).map((s) => s.id));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggle(id: number) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function act(action: "approve" | "reject") {
    setError("");
    if (action === "approve" && picked.length === 0) {
      return setError("Assign at least one guide before approving.");
    }
    setLoading(true);
    const res = await fetch(`/api/admin/bookings/${code}/approve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, guideIds: picked }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Action failed.");
    router.refresh();
  }

  return (
    <section className="rounded-card border-2 border-cta-500 bg-cta-500/10 p-4">
      <h2 className="font-display text-[15px] font-bold">Approve & assign guide</h2>
      <p className="mt-1 text-xs text-ink-600">
        Assignment is mandatory. Suggested by availability → barangay proximity → specialty → fair rotation → rating.
        Need <b>{guidesNeeded}</b> guide{guidesNeeded > 1 ? "s" : ""} for this group.
      </p>

      <div className="mt-3 space-y-2">
        {suggestions.length === 0 && <p className="text-sm text-danger">No guides available on this date. Try another date or free up a guide.</p>}
        {suggestions.map((s, i) => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={`flex w-full items-center justify-between rounded-btn border-2 px-3 py-2 text-left text-sm transition ${picked.includes(s.id) ? "border-brand-700 bg-brand-100" : "border-line bg-white"}`}
          >
            <div>
              <div className="font-semibold">
                {i === 0 && <span className="mr-1 rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold text-white">BEST</span>}
                {s.fullName}
              </div>
              <div className="text-xs text-ink-600">Brgy. {s.barangay} · {s.recentDuties} duties/30d · <StarIcon size={11} weight="fill" className="inline text-cta-700" /> {s.ratingAvg > 0 ? s.ratingAvg.toFixed(1) : "new"}</div>
            </div>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${picked.includes(s.id) ? "bg-brand-700 text-white" : "border border-line text-ink-600"}`}>
              {picked.includes(s.id) ? "✓" : "+"}
            </span>
          </button>
        ))}
      </div>

      {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-danger">{error}</div>}

      <div className="mt-3 flex gap-2">
        <button onClick={() => act("approve")} disabled={loading} className="btn btn-green flex-1 disabled:opacity-60">
          <SealCheckIcon size={16} weight="fill" /> {loading ? "…" : "Approve"}
        </button>
        <button onClick={() => act("reject")} disabled={loading} className="btn btn-outline">
          <XCircleIcon size={16} /> Reject
        </button>
      </div>
    </section>
  );
}
