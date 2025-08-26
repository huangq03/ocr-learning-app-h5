import DashboardInterface from "@/components/dashboard-interface"
import { getPageSession } from "@/lib/actions"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const { session } = await getPageSession()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-lavender-50">
      <DashboardInterface user={session.user} />
    </div>
  )
}
