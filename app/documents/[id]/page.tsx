import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import TextSelectionInterface from "@/components/text-selection-interface"

interface DocumentPageProps {
  params: {
    id: string
  }
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  // Await params as per Next.js requirements
  const { id } = await params;

  // If Supabase is not configured, show setup message
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Connect Supabase to get started</h1>
      </div>
    )
  }

  // Get the user from the server
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch document
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (docError || !document) {
    notFound()
  }

  // Create a mock extractedText object from the document's recognized_text
  const extractedText = {
    id: document.id,
    document_id: document.id,
    raw_text: document.recognized_text?.cleaned_text || "",
    key_phrases: document.recognized_text?.key_phrases || [],
    sentences: document.recognized_text?.sentences || [],
    created_at: document.created_at
  };

  // Fetch existing selections for this document
  const { data: existingItems } = await supabase
    .from("selections")
    .select("*")
    .eq("document_id", document.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <TextSelectionInterface
        user={user}
        document={document}
        extractedText={extractedText}
        existingItems={existingItems || []}
      />
    </div>
  )
}
