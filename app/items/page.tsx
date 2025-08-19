import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import ItemGroup from '@/components/item-group';

export const dynamic = 'force-dynamic';

export default async function ItemsManagementPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <p>Please log in to see your items.</p>
      </div>
    );
  }

  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, created_at, recognized_text')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <p>Error loading items.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">All Items</h1>
        <div className="space-y-6">
          {documents?.map(doc => (
            <ItemGroup key={doc.id} document={doc as any} />
          ))}
        </div>
      </div>
    </div>
  );
}
