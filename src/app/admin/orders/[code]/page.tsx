import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { peso, shortDate } from "@/lib/format";
import OrderPaymentPanel from "./OrderPaymentPanel";
import OrderStatusPanel from "./OrderStatusPanel";

export const dynamic = "force-dynamic";

const STATUS_CLASS: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  payment_review: "bg-amber-100 text-amber-800",
  paid: "bg-brand-100 text-brand-700",
  ready_for_pickup: "bg-ok/15 text-ok",
  picked_up: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
};

export default async function AdminOrderDetail({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await prisma.productOrder.findUnique({
    where: { orderCode: code },
    include: {
      booking: true,
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      statusLogs: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeftIcon size={15} /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-700">{order.orderCode}</h1>
          <p className="text-sm text-ink-600">
            Booking <Link href={`/admin/bookings/${order.booking.bookingCode}`} className="font-semibold hover:underline">{order.booking.bookingCode}</Link>
            {" "}· {order.booking.touristName} · Pickup {shortDate(order.pickupDate)}
          </p>
        </div>
        <span className={`pill ${STATUS_CLASS[order.status] ?? "bg-gray-100 text-gray-600"}`}>{order.status.replace(/_/g, " ")}</span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card title="Items">
            {order.items.map((i) => (
              <div key={i.id} className="flex justify-between border-b border-dashed border-line py-1.5 text-sm">
                <span>{i.qty} {i.unit} × {i.name}</span><b>{peso(i.lineTotal)}</b>
              </div>
            ))}
            <div className="mt-1.5 flex justify-between font-display font-extrabold"><span>Total</span><span>{peso(order.totalAmount)}</span></div>
            <div className="flex justify-between text-sm text-ink-600"><span>Paid</span><span>{peso(order.amountPaid)}</span></div>
          </Card>

          <Card title="Tourist">
            <Row label="Name" value={order.booking.touristName} />
            <Row label="Mobile" value={order.booking.touristMobile} />
          </Card>

          <Card title="Status history">
            {order.statusLogs.map((l) => (
              <div key={l.id} className="flex justify-between py-1 text-[13px]">
                <span>{l.note ?? l.toStatus}</span>
                <span className="text-ink-600">{shortDate(l.createdAt)}</span>
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-6">
          {(order.status === "pending_payment" || order.status === "payment_review") && (
            <OrderPaymentPanel
              orderCode={order.orderCode}
              orderStatus={order.status}
              totalAmount={order.totalAmount}
              pendingPayment={(() => {
                const p = order.payments.find((x) => x.status === "pending");
                return p ? { id: p.id, amount: p.amount, gatewayRef: p.gatewayRef, senderName: p.senderName } : null;
              })()}
            />
          )}

          {(order.status === "paid" || order.status === "ready_for_pickup") && (
            <OrderStatusPanel orderCode={order.orderCode} orderStatus={order.status} />
          )}

          {order.payments.length > 0 && (
            <Card title="Payments">
              {order.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-line py-1.5 text-[13px] last:border-0">
                  <span className="font-semibold">{peso(p.amount)}</span>
                  <span className="text-ink-600">{p.method}{p.gatewayRef ? ` · ${p.gatewayRef}` : ""}{p.orNumber ? ` · OR ${p.orNumber}` : ""}</span>
                  <span className={`pill ${p.status === "paid" ? "bg-brand-100 text-brand-700" : p.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-danger"}`}>{p.status}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-card">
      <h2 className="mb-2 font-display text-[15px] font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-ink-600">{label}</span><span className="font-semibold">{value}</span>
    </div>
  );
}
