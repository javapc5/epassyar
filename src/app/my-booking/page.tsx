import { redirect } from "next/navigation";
import { MagnifyingGlassIcon, ShieldCheckIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { grantBookingAccess } from "@/lib/booking-access";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

/**
 * Privacy-safe lookup: a booking is only revealed when the visitor supplies BOTH
 * the reference code AND the last 4 digits of the mobile number on the booking.
 * (No public listing of bookings — that would expose tourist PII.)
 *
 * Clearing this check is what grants access to /booking/[code]; that page has no
 * other public entry point, so this action is the enumeration choke point and is
 * rate limited accordingly.
 */
async function lookup(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const last4 = String(formData.get("last4") ?? "").replace(/\D/g, "").slice(-4);
  const fail = `/my-booking?e=1${code ? `&code=${encodeURIComponent(code)}` : ""}`;

  if (!code || last4.length !== 4) {
    redirect(fail);
  }

  const ip = await clientIp();
  if (!rateLimit(`lookup:${ip}`, 10, 10 * 60 * 1000).ok) {
    redirect(`/my-booking?e=rate`);
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingCode: code },
    select: { touristMobile: true },
  });
  const digits = (booking?.touristMobile ?? "").replace(/\D/g, "");
  if (!booking || digits.slice(-4) !== last4) {
    redirect(fail);
  }

  await grantBookingAccess(code);
  redirect(`/booking/${code}`);
}

export default async function MyBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; code?: string; verify?: string }>;
}) {
  const { e, code, verify } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="wrap max-w-lg py-12">
        <h1 className="font-display text-2xl font-extrabold">Track Your Booking</h1>
        <p className="mt-1 text-[13.5px] text-ink-600">
          Enter your booking reference and the last 4 digits of your mobile number to view status, cost, and your QR pass.
        </p>

        {verify && (
          <div className="mt-4 flex items-start gap-1.5 rounded-btn bg-river-100/50 px-3 py-2.5 text-xs font-semibold text-river-500">
            <ShieldCheckIcon size={15} weight="fill" className="mt-px shrink-0" />
            Just confirming it&apos;s you — enter the last 4 digits of the mobile number used for this booking.
          </div>
        )}

        <form action={lookup} className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-brand-700">Booking reference</span>
            <input
              name="code"
              required
              defaultValue={code ?? ""}
              placeholder="BGL-XXXXXXXX"
              className="w-full rounded-btn border border-line px-3 py-2.5 text-sm uppercase outline-none focus:border-brand-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-brand-700">Last 4 digits of your mobile</span>
            <input
              name="last4"
              inputMode="numeric"
              maxLength={4}
              required
              placeholder="1234"
              className="w-full rounded-btn border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </label>

          {e === "rate" ? (
            <div role="alert" className="flex items-start gap-1.5 rounded-btn bg-red-50 px-3 py-2 text-xs font-semibold text-danger">
              <WarningCircleIcon size={15} weight="fill" className="mt-px shrink-0" />
              Too many attempts. Please wait a few minutes and try again, or call the Tourism Office for help.
            </div>
          ) : e ? (
            <div role="alert" className="flex items-start gap-1.5 rounded-btn bg-red-50 px-3 py-2 text-xs font-semibold text-danger">
              <WarningCircleIcon size={15} weight="fill" className="mt-px shrink-0" />
              No booking matched that reference and mobile number. Please check and try again.
            </div>
          ) : null}

          <button className="btn btn-green w-full"><MagnifyingGlassIcon size={16} weight="bold" /> Find my booking</button>
        </form>

        <p className="mt-5 flex items-start gap-1.5 text-xs text-ink-600">
          <ShieldCheckIcon size={15} weight="fill" className="mt-0.5 shrink-0 text-brand-500" />
          For your privacy, booking details are only shown to someone who knows both the reference code and the mobile number used to book.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
