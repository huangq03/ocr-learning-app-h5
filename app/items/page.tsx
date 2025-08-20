import ItemGroup from '@/components/item-group';
import { getItemsPageData, getPageSession } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function ItemsManagementPage() {
  const { session } = await getPageSession();

  if (!session) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <p>Please log in to see your items.</p>
      </div>
    );
  }

  const { documents, error } = await getItemsPageData(session.user.id);

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