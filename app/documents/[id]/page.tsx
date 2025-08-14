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
  // If Supabase is not configured, show setup message
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Connect Supabase to get started</h1>
      </div>
    )
  }

  // Get the user from the server
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch document and extracted text
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (docError || !document) {
    notFound()
  }

  const { data: extractedText, error: textError } = await supabase
    .from("extracted_texts")
    .select("*")
    .eq("document_id", params.id)
    .single()

  if (textError || !extractedText) {
    notFound()
  }

  // Fetch existing text items for this document
  const { data: existingItems } = await supabase
    .from("text_items")
    .select("*")
    .eq("extracted_text_id", extractedText.id)
    .eq("user_id", user.id)

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
