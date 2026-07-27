import Link from "next/link";
import { redirect } from "next/navigation";
import { MountainsIcon, LockKeyIcon, ArrowLeftIcon, WarningCircleIcon, SignInIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { login } from "./actions";
import { isMediaUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; e?: string }> }) {
  const { next, e } = await searchParams;
  const [user, muni] = await Promise.all([getSessionUser(), prisma.municipality.findUnique({ where: { id: 1 } })]);
  if (user) redirect("/admin");
  const name = muni?.name ?? "Bagulin";
  const logo = isMediaUrl(muni?.logoUrl) ? muni!.logoUrl : null;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-canopy px-5 py-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-blob bg-white/5 blur-sm" />
      <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-blob bg-cta-500/10" />

      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 transition-colors hover:text-white">
          <ArrowLeftIcon size={15} weight="bold" /> Back to public site
        </Link>

        <div className="rounded-xl2 bg-surface p-7 shadow-pop">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-canopy text-white shadow-sm">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="h-7 w-7 object-contain" />
              ) : (
                <MountainsIcon size={24} weight="duotone" />
              )}
            </span>
            <div>
              <h1 className="font-display text-lg font-extrabold leading-tight text-ink-900">{name} Tourism</h1>
              <p className="flex items-center gap-1 text-xs font-semibold text-ink-600">
                <LockKeyIcon size={12} weight="fill" /> Tourism Office sign in
              </p>
            </div>
          </div>

          <form action={login} className="space-y-3">
            <input type="hidden" name="next" value={next ?? "/admin"} />

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-brand-700">Email</span>
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="admin@bagulin.gov.ph"
                className="w-full rounded-btn border border-line px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-brand-700">Password</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-btn border border-line px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-500"
              />
            </label>

            {e && (
              <div role="alert" className="flex items-center gap-1.5 rounded-btn bg-red-50 px-3 py-2 text-xs font-semibold text-danger">
                <WarningCircleIcon size={15} weight="fill" /> Incorrect email or password.
              </div>
            )}

            <button type="submit" className="btn btn-green mt-1 w-full">
              <SignInIcon size={17} weight="bold" /> Sign in
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-400">
            Authorized municipal staff only. Access is logged.
          </p>
        </div>
      </div>
    </main>
  );
}
