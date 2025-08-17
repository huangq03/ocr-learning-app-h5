import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import StudySessionCreator from '@/components/study-session-creator';

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
export default async function DocumentPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: document, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !document) {
    notFound();
  }

  return <StudySessionCreator document={document as unknown as Document} />;
}