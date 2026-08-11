import Image from 'next/image';
import Link from 'next/link';
import { VerificationGateHost } from '@/components/shared/auth/verification-gate-host';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* Left brand panel — .brand-side */}
      <aside className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-footer text-primary-foreground">
        {/* Photo */}
        <div className="absolute inset-0">
          <Image
            src="/home/hero-photo.png"
            alt="Кампания Ritm"
            fill
            sizes="50vw"
            className="object-cover opacity-55"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, hsl(220 16% 9% / .35) 0%, hsl(220 16% 9% / .55) 45%, hsl(220 16% 9% / .92) 100%)',
            }}
          />
        </div>

        {/* Top: logo + back link */}
        <div className="relative z-1 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Ritm">
            <Image src="/ritm-logo-light.svg" alt="" width={110} height={30} className="w-[110px] h-auto" />
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-primary-foreground/80 text-[13px] font-semibold px-3.5 py-2 border border-primary-foreground/20 rounded-full hover:bg-primary-foreground/10 hover:border-primary-foreground/40 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 6-6 6 6 6" />
            </svg>
            В каталог
          </Link>
        </div>

        {/* Copy + perks */}
        <div className="relative z-1 max-w-[460px] mb-2">
          <span className="text-[11px] font-bold uppercase tracking-[.16em] text-primary-foreground/70">Ritm Club</span>
          <h2 className="mt-4 font-display font-bold text-[30px] sm:text-[46px] leading-[1.02] tracking-tight">
            Гардероб, который запоминает ваш стиль
          </h2>
          <p className="mt-4 text-primary-foreground/72 text-[15px] max-w-[40ch]">
            Войдите, чтобы сохранять избранное, отслеживать заказы и первыми получать доступ к новым капсулам.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-6">
            {['Ранний доступ к дропам', 'Сохранённые размеры', 'Закрытые скидки'].map((perk) => (
              <span
                key={perk}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/16 text-[12.5px] font-semibold text-primary-foreground/92"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {perk}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* Right form panel — .form-side */}
      <main className="flex items-start justify-center px-6 pt-20 pb-12">
        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-1/2 -translate-x-1/2">
          <Link href="/" aria-label="Ritm">
            <Image src="/ritm-logo.svg" alt="" width={112} height={30} className="w-[112px] h-auto" />
          </Link>
        </div>
        {children}
      </main>
      <VerificationGateHost />
    </div>
  );
}
