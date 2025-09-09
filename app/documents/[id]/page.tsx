import { redirect, notFound } from 'next/navigation';
import StudySessionCreator from '@/components/study-session-creator';
import { getPageSession, getEnrichedDocumentItemsAction } from '@/lib/actions';

// Server Component that fetches data and passes it to the client component
export default async function DocumentPage({ params }) {
  const { id } = await params;
  const { session } = await getPageSession();

  if (!session) {
    redirect('/auth/login');
  }

  const { items, error } = await getEnrichedDocumentItemsAction(id);

  if (error || !items) {
    notFound();
  }

  return <StudySessionCreator items={items} documentId={id} />;
}
