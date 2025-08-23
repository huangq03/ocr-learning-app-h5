import DashboardInterface from "@/components/dashboard-interface"
import LandingPage from "@/components/landing-page"
import { getPageSession } from "@/lib/actions"

export default async function Home() {
  const { session, isSupabaseConfigured } = await getPageSession()

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Connect Supabase to get started</h1>
      </div>
    )
  }

  if (!session) {
    return <LandingPage />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-lavender-50">
      <DashboardInterface user={session.user} />
    </div>
  )
}
