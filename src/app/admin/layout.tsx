import Link from "next/link";
import {
  GaugeIcon,
  CalendarCheckIcon,
  MountainsIcon,
  UserCircleCheckIcon,
  ChartLineUpIcon,
  HouseIcon,
  PackageIcon,
  BasketIcon,
  GearSixIcon,
  HouseLineIcon,
  QrCodeIcon,
  SignOutIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { isMediaUrl } from "@/lib/format";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: <GaugeIcon size={20} weight="duotone" /> },
  { href: "/admin/bookings", label: "Bookings", icon: <CalendarCheckIcon size={20} weight="duotone" /> },
  { href: "/admin/checkin", label: "QR Check-in", icon: <QrCodeIcon size={20} weight="duotone" /> },
  { href: "/admin/destinations", label: "Destinations", icon: <MountainsIcon size={20} weight="duotone" /> },
  { href: "/admin/packages", label: "Packages", icon: <PackageIcon size={20} weight="duotone" /> },
  { href: "/admin/products", label: "Local Products", icon: <BasketIcon size={20} weight="duotone" /> },
  { href: "/admin/guides", label: "Tour Guides", icon: <UserCircleCheckIcon size={20} weight="duotone" /> },
  { href: "/admin/stay", label: "Homestays", icon: <HouseLineIcon size={20} weight="duotone" /> },
  { href: "/admin/analytics", label: "Analytics", icon: <ChartLineUpIcon size={20} weight="duotone" /> },
  { href: "/admin/settings", label: "Settings", icon: <GearSixIcon size={20} weight="duotone" /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, muni] = await Promise.all([requireUser(), prisma.municipality.findUnique({ where: { id: 1 } })]);
  const logo = isMediaUrl(muni?.logoUrl) ? muni!.logoUrl : null;
  return (
    <div className="min-h-screen bg-bg">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-ink-900 p-4 text-white md:flex">
          <Link href="/admin" className="mb-6 flex items-center gap-2 font-display">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-9 w-9 object-contain" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/15">
                <MountainsIcon size={20} weight="duotone" />
              </span>
            )}
            <div className="leading-tight">
              <div className="text-[17px] font-extrabold">
                <span className="text-cta-400">e</span>Passyar
              </div>
              <div className="text-[11px] font-medium text-white/50">{muni?.name ?? "Bagulin"} Admin</div>
            </div>
          </Link>
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium text-[#B4B9C0] hover:bg-white/10 hover:text-white">
                {n.icon} {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-1 border-t border-white/10 pt-3">
            <div className="px-3 pb-1">
              <div className="truncate text-sm font-bold text-white">{user.fullName}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-400">{user.role.replace("_", " ")}</div>
            </div>
            <Link href="/" className="flex items-center gap-2 rounded-btn px-3 py-2 text-sm text-[#B4B9C0] hover:bg-white/10 hover:text-white">
              <HouseIcon size={18} /> View public site
            </Link>
            <form action={logout}>
              <button className="flex w-full items-center gap-2 rounded-btn px-3 py-2 text-sm text-[#B4B9C0] hover:bg-white/10 hover:text-white">
                <SignOutIcon size={18} /> Sign out
              </button>
            </form>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
