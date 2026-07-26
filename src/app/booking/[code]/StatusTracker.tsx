import { SealCheckIcon, CircleDashedIcon } from "@phosphor-icons/react/dist/ssr";

const STEPS = [
  { key: "reserved", label: "Reserved" },
  { key: "paid", label: "Paid" },
  { key: "approved", label: "Approved" },
  { key: "enjoy", label: "Enjoy!" },
];

function reached(status: string): number {
  switch (status) {
    case "pending_payment": return 0;
    case "payment_review": return 0;
    case "pending_approval": return 1;
    case "approved": return 2;
    case "checked_in":
    case "completed": return 3;
    default: return -1;
  }
}

export default function StatusTracker({ status }: { status: string }) {
  const at = reached(status);
  if (status === "cancelled" || status === "expired") {
    return <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600">This booking is {status}.</div>;
  }
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = i <= at;
        return (
          <div key={s.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              {done ? <SealCheckIcon size={24} weight="fill" className="text-brand-700" /> : <CircleDashedIcon size={24} className="text-ink-600/50" />}
              <span className={`mt-1 text-[11px] font-semibold ${done ? "text-brand-700" : "text-ink-600"}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < at ? "bg-brand-700" : "bg-line"}`} />}
          </div>
        );
      })}
    </div>
  );
}
