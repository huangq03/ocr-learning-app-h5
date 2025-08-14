import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import StudyInterface from "@/components/study-interface"

export default async function StudyPage() {
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

  // Fetch items due for review today
  const today = new Date().toISOString().split("T")[0]
  const { data: dueItems } = await supabase
    .from("spaced_repetition_schedule")
    .select(`
      *,
      text_items (
        id,
        content,
        item_type,
        context,
        user_definition,
        difficulty_level
      )
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .lte("next_review_date", today)
    .order("next_review_date", { ascending: true })

  // Fetch user progress
  const { data: userProgress } = await supabase.from("user_progress").select("*").eq("user_id", user.id).single()

  // Fetch total stats
  const { data: totalItems } = await supabase.from("text_items").select("id").eq("user_id", user.id)

  const { data: masteredItems } = await supabase
    .from("spaced_repetition_schedule")
    .select("id")
    .eq("user_id", user.id)
    .gte("ease_factor", 2.5)
    .gte("repetition_number", 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <StudyInterface
        user={user}
        dueItems={dueItems || []}
        userProgress={userProgress}
        totalItems={totalItems?.length || 0}
        masteredItems={masteredItems?.length || 0}
      />
    </div>
  )
}
