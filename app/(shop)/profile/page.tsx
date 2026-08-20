import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ProfileVariantA } from '@/components/evironn/profile/profile-variant-a';
import { getProfilePageDto } from '@/lib/profile-page';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Профиль' };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const dto = await getProfilePageDto(session.user.id);
  return <ProfileVariantA dto={dto} />;
}
