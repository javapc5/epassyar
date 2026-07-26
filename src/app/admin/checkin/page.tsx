import { QrCodeIcon } from "@phosphor-icons/react/dist/ssr";
import CheckinPanel from "./CheckinPanel";

export const dynamic = "force-dynamic";

export default async function CheckinPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;

  return (
    <>
      <div className="flex items-center gap-2">
        <QrCodeIcon size={26} weight="duotone" className="text-brand-700" />
        <h1 className="font-display text-2xl font-extrabold">QR Check-in</h1>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-ink-600">
        Scan a tourist&apos;s QR pass with your phone camera to open this page, or enter their booking code below. Only
        approved, paid bookings can check in — this records arrival, marks the guide&apos;s duty complete, and enforces
        each site&apos;s daily capacity.
      </p>
      <div className="mt-5 max-w-xl">
        <CheckinPanel initialToken={t ?? null} />
      </div>
    </>
  );
}
