import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import PhotoCaptureInterface from "@/components/photo-capture-interface"
import DashboardInterface from "@/components/dashboard-interface"

export default async function Home() {
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

  // Check if user has any documents
  const { data: documents } = await supabase.from("documents").select("id").eq("user_id", user.id).limit(1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-lavender-50">
      <DashboardInterface user={user} />
    </div>
  )
}
