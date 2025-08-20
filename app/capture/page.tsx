import { redirect } from "next/navigation"
import PhotoCaptureInterface from "@/components/photo-capture-interface"
import { getPageSession } from "@/lib/actions"

export default async function CapturePage() {
  const { session, isSupabaseConfigured } = await getPageSession();

  // If Supabase is not configured, show setup message
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Connect Supabase to get started</h1>
      </div>
    )
  }

  // If no user, redirect to login
  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <PhotoCaptureInterface user={session.user} />
    </div>
  )
}
