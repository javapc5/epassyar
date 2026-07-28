import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { signPass } from "@/lib/qr";
import { shortDate } from "@/lib/format";
import { dispatchQueuedSms } from "@/lib/sms";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const staff = await getSessionUser();
  if (!staff) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { action, guideIds = [] } = body;

  const booking = await prisma.booking.findUnique({
    where: { bookingCode: code },
    include: { destinations: { include: { destination: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (booking.status !== "pending_approval") {
    return NextResponse.json({ error: "This booking is not awaiting approval." }, { status: 409 });
  }

  if (action === "reject") {
    await prisma.$transaction([
      prisma.booking.update({ where: { id: booking.id }, data: { status: "cancelled", cancelReason: "Rejected by Tourism Office" } }),
      prisma.bookingStatusLog.create({ data: { bookingId: booking.id, fromStatus: "pending_approval", toStatus: "cancelled", note: `Rejected by ${staff.fullName}` } }),
      prisma.smsLog.create({ data: { bookingId: booking.id, recipientMobile: booking.touristMobile, recipientType: "tourist", template: "BOOKING_REJECTED", message: `Bagulin Tourism: We're sorry, booking ${code} could not be approved. Your reservation fee will be refunded.` } }),
    ]);
    await dispatchQueuedSms(booking.id);
    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  // Approve — assignment is mandatory
  const ids: number[] = (guideIds as any[]).map(Number).filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ error: "Assign at least one guide before approving." }, { status: 400 });
  }
  const guides = await prisma.tourGuide.findMany({ where: { id: { in: ids } } });
  if (guides.length !== ids.length) {
    return NextResponse.json({ error: "One or more selected guides were not found." }, { status: 400 });
  }

  const token = signPass(booking.id, booking.bookingCode);
  const siteNames = booking.destinations.map((d) => d.destination.name).join(", ");

  await prisma.$transaction([
    prisma.booking.update({ where: { id: booking.id }, data: { status: "approved", approvedAt: new Date() } }),
    prisma.guideAssignment.createMany({
      data: ids.map((guideId) => ({ bookingId: booking.id, guideId, dutyDate: booking.visitDate, status: "notified", notifiedAt: new Date() })),
    }),
    prisma.qrPass.create({ data: { bookingId: booking.id, token } }),
    prisma.bookingStatusLog.create({ data: { bookingId: booking.id, fromStatus: "pending_approval", toStatus: "approved", note: `Approved by ${staff.fullName}; ${ids.length} guide(s) assigned` } }),
    prisma.smsLog.create({ data: { bookingId: booking.id, recipientMobile: booking.touristMobile, recipientType: "tourist", template: "BOOKING_APPROVED", message: `Bagulin Tourism: APPROVED! Booking ${code} for ${shortDate(booking.visitDate)}. Show your QR pass on arrival. Balance PHP ${booking.totalAmount - booking.amountPaid} payable on-site.` } }),
    ...guides.map((g) =>
      prisma.smsLog.create({
        data: {
          bookingId: booking.id,
          recipientMobile: g.mobile ?? "(no mobile on file)",
          recipientType: "guide",
          template: "GUIDE_DUTY",
          message: `DUTY: ${shortDate(booking.visitDate)} — ${siteNames}, ${booking.paxAdults + booking.paxChildren} pax, lead: ${booking.touristName}.${booking.baggageKg > 0 ? ` Extra baggage ~${booking.baggageKg}kg${booking.baggageNotes ? ` (${booking.baggageNotes})` : ""}.` : ""} Reply YES to confirm.`,
        },
      }),
    ),
  ]);

  await dispatchQueuedSms(booking.id);
  return NextResponse.json({ ok: true, status: "approved" });
}
