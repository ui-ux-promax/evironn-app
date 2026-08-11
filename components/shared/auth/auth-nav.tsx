import Link from 'next/link';
import { cookies } from 'next/headers';
import { auth, signOut } from '@/auth';
import { cartCookieName } from '@/lib/cart-cookie';
import { wishlistCookieName } from '@/lib/wishlist-cookie';
import { LogoutButton } from './logout-button';
import { ProfileLink } from './profile-link';

const iconClass =
  'grid h-[34px] w-[34px] place-items-center rounded-full border border-line/72 bg-surface shadow-sm transition-colors hover:border-ink/35';

export async function AuthNav() {
  const session = await auth();
  if (!session?.user) {
    return (
      <Link href="/login" className={iconClass} aria-label="Войти">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8.25" />
          <circle cx="12" cy="10.35" r="2.35" />
          <path d="M7.95 16.35a5 5 0 0 1 8.1 0" />
        </svg>
      </Link>
    );
  }
  return (
    <div className="flex items-center">
      <ProfileLink />
      <form
        action={async () => {
          'use server';
          const store = await cookies();
          store.delete(cartCookieName);
          store.delete(wishlistCookieName);
          await signOut({ redirectTo: '/' });
        }}
      >
        <LogoutButton />
      </form>
    </div>
  );
}
