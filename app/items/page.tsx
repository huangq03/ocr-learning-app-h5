import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
          {documents?.map(doc => {
            const items = doc.recognized_text?.items || [];
            const cleaned_text = doc.recognized_text?.cleaned_text || '';
            const sortedItems = [...items].sort((a, b) => {
                const indexA = cleaned_text.indexOf(a);
                const indexB = cleaned_text.indexOf(b);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });

            return (
              <Card key={doc.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg font-medium">
                    <span>Document from {new Date(doc.created_at).toLocaleDateString()}</span>
                    <Badge variant="outline">{items.length} items</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 list-disc list-inside">
                    {sortedItems.map((item, index) => (
                      <li key={index} className="p-2 bg-gray-100 rounded-md text-gray-800">{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}