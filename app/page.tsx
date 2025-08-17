import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardInterface from "@/components/dashboard-interface"

export default async function Home() {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Connect Supabase to get started</h1>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch the live document count directly.
  const { count: totalDocuments, error: countError } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-lavender-50">
      <DashboardInterface user={user} totalDocuments={totalDocuments || 0} />
    </div>
  )
}