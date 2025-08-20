import { redirect } from 'next/navigation';
import ProfileInterface from '@/components/profile-interface';
import { getProfilePageData } from '@/lib/actions';

export default async function ProfilePage() {
  const { user, stats, error } = await getProfilePageData();

  if (error || !user) {
    redirect('/auth/login');
  }

  return <ProfileInterface user={user} initialStats={stats} />;
}
