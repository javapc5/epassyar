import { prisma } from "@/lib/prisma";
import { peso } from "@/lib/format";
import { BasketIcon } from "@phosphor-icons/react/dist/ssr";
import ProductPaymentPanel from "./ProductPaymentPanel";

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending_payment: { label: "Awaiting payment", className: "bg-amber-100 text-amber-800" },
  payment_review: { label: "Payment under review", className: "bg-amber-100 text-amber-800" },
  paid: { label: "Paid — preparing", className: "bg-brand-100 text-brand-700" },
  ready_for_pickup: { label: "Ready for pickup", className: "bg-ok/15 text-ok" },
  picked_up: { label: "Picked up", className: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-500" },
};

export default async function ProductOrdersSection({ bookingId }: { bookingId: number }) {
  const [orders, muni] = await Promise.all([
    prisma.productOrder.findMany({
      where: { bookingId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.municipality.findUnique({ where: { id: 1 } }),
  ]);

  if (orders.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
        <BasketIcon size={20} weight="duotone" className="text-brand-700" /> Your product orders
      </h3>
      <div className="mt-2 space-y-3">
        {orders.map((o) => {
          const meta = STATUS_META[o.status] ?? { label: o.status, className: "bg-gray-100 text-gray-600" };
          return (
            <div key={o.id} className="rounded-card border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display font-bold text-brand-700">{o.orderCode}</span>
                <span className={`pill ${meta.className}`}>{meta.label}</span>
              </div>
              <div className="mt-2 space-y-1">
                {o.items.map((i) => (
                  <div key={i.id} className="flex justify-between text-[13.5px]">
                    <span>{i.qty} {i.unit} × {i.name}</span>
                    <b>{peso(i.lineTotal)}</b>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between border-t border-dashed border-line pt-1.5 text-sm font-extrabold">
                <span>Total</span><span>{peso(o.totalAmount)}</span>
              </div>

              {o.status === "pending_payment" && (
                <ProductPaymentPanel
                  orderCode={o.orderCode}
                  totalAmount={o.totalAmount}
                  expiresAt={o.expiresAt?.toISOString() ?? null}
                  gcash={{ name: muni?.gcashName ?? null, number: muni?.gcashNumber ?? null, qrUrl: muni?.gcashQrUrl ?? null }}
                />
              )}
              {o.status === "payment_review" && (
                <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
                  GCash reference received — the Tourism Office is verifying it. You&apos;ll get an SMS once confirmed.
                </div>
              )}
              {(o.status === "paid" || o.status === "ready_for_pickup") && (
                <div className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-[12.5px] text-brand-700">
                  Pick up at the Municipal Tourism Office on your visit day — show your QR pass.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
