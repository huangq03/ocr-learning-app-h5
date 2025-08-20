"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Update the signIn function to handle redirects properly
export async function signIn(prevState: any, formData: FormData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  // Validate required fields
  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    // Return success instead of redirecting directly
    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Update the signUp function to handle potential null formData
export async function signUp(prevState: any, formData: FormData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  // Validate required fields
  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Check your email to confirm your account." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function getDashboardData(userId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: userProgress } = await supabase.from("user_progress").select("*").eq("user_id", userId).maybeSingle()
    const today = new Date().toISOString().split("T")[0]
    const { count: dueItemsCount } = await supabase
      .from("spaced_repetition_schedule")
      .select("id", { count: 'exact', head: true })
      .eq("user_id", userId)
      .eq("is_active", true)
      .lte("next_review_date", today)

    const { data: masteredItemsCount, error: masteredError } = await supabase.rpc('get_mastered_items_count', { p_user_id: userId });
    if (masteredError) throw masteredError;

    const { data: currentStreak, error: streakError } = await supabase.rpc('get_day_streak', { p_user_id: userId });
    if (streakError) throw streakError;

    const { data: recentTextItems } = await supabase
      .from('text_items')
      .select('document_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    let recentDocuments: any[] = [];
    if (recentTextItems) {
        const recentDocumentIds = [...new Set(recentTextItems.map(item => item.document_id))].slice(0, 3);
        
        if (recentDocumentIds.length > 0) {
            const { data: documents } = await supabase
                .from('documents')
                .select('id, created_at, recognized_text')
                .in('id', recentDocumentIds)
                .order('created_at', { ascending: false });
            recentDocuments = documents || [];
        }
    }

    const stats = {
      totalDocuments: userProgress?.total_documents || 0,
      totalItems: userProgress?.total_text_items || 0,
      itemsDue: dueItemsCount || 0,
      masteredItems: masteredItemsCount || 0,
      currentStreak: currentStreak || 0,
      studyTimeHours: Math.round((userProgress?.total_study_time_minutes || 0) / 60),
    };

    return { stats, recentDocuments };

  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return { error: "Failed to fetch dashboard data." };
  }
}