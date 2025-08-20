import { redirect, notFound } from 'next/navigation';
import StudySessionCreator from '@/components/study-session-creator';
import { getPageSession, getDocumentById } from '@/lib/actions';

// Define the type for our document data
interface Document {
  id: string;
  user_id: string;
  created_at: string;
  file_path: string;
  recognized_text: {
    items: string[];
    cleaned_text: string;
  };
}

// Server Component that fetches data and passes it to the client component
export default async function DocumentPage({ params }) {
  const { id } = await params;
  const { session } = await getPageSession();

  if (!session) {
    redirect('/auth/login');
  }

  const { document, error } = await getDocumentById(id, session.user.id);

  if (error || !document) {
    notFound();
  }

  return <StudySessionCreator document={document as unknown as Document} />;
}
