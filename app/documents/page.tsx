'use client'; // This page is interactive, so it's a client component at the top level.

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Edit, PlusCircle, ArrowLeft } from 'lucide-react';

// Define the type for our document data
interface Document {
  id: string;
  created_at: string;
  file_path: string;
  recognized_text: {
    items: string[];
    cleaned_text: string;
  };
}

export default function DocumentManagementPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserAndDocuments = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
      } else {
        setDocuments(data as Document[]);
      }
      setIsLoading(false);
    };

    getUserAndDocuments();
  }, [router, supabase]);

  const handleDelete = async (documentId: string, filePath: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this document permanently?')) {
      return;
    }

    // Extract the file name from the full URL path
    const fileName = filePath.split('/').pop();
    if (!fileName) {
        alert("Could not determine file name to delete.");
        return;
    }

    // 1. Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([`${user.id}/${fileName}`]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      alert('Failed to delete the document file. Please try again.');
      return;
    }

    // 2. Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('Error deleting document from database:', dbError);
      alert('Failed to delete the document record. Please try again.');
    } else {
      // Update UI
      setDocuments(documents.filter(doc => doc.id !== documentId));
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading documents...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => router.push('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">Document Management</h1>
            <Button onClick={() => router.push('/capture')}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add New Document
            </Button>
        </div>

        <div className="space-y-4">
          {documents.map(doc => (
            <Card key={doc.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img 
                src={doc.file_path}
                alt="Document thumbnail"
                className="w-full sm:w-32 h-auto sm:h-24 object-cover rounded-md border"
              />
              <div className="flex-grow">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {doc.recognized_text?.cleaned_text || 'No text recognized.'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Created on {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex-shrink-0 flex sm:flex-col gap-2 self-end sm:self-center">
                <Button variant="outline" size="sm" onClick={() => router.push(`/documents/${doc.id}`)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit / Study
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(doc.id, doc.file_path)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </Card>
          ))}
          {documents.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">You haven't created any documents yet.</p>
                <Button className="mt-4" onClick={() => router.push('/capture')}>Create Your First Document</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
