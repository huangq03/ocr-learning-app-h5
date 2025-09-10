import { redirect, notFound } from 'next/navigation';
import StudySessionCreator from '@/components/study-session-creator';
import { getPageSession, getDocumentById } from '@/lib/actions';

// Server Component that fetches data and passes it to the client component
export default async function DocumentPage({ params }) {
  const { id } = await params;
  const { session } = await getPageSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Fetch the full document object, which contains the initial list of recognized text.
  const { document, error } = await getDocumentById(id);

  if (error || !document) {
    // If the document doesn't exist or there was an error, show a 404 page.
    notFound();
  }

  // The document object contains Date objects, which are not serializable.
  // We convert it to a plain object before passing it to the Client Component.
  const plainDocument = JSON.parse(JSON.stringify(document));

  return <StudySessionCreator document={plainDocument} />;
}
