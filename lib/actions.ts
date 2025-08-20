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

  const cookieStore = await cookies()
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

  const cookieStore = await cookies()
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
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function getDashboardData(userId: string) {
  const cookieStore = await cookies()
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

    let recentDocuments: any[] = []
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

export async function saveDictationResult(result: any) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase.from("dictation_exercises").insert(result);
    if (error) {
      console.error("Error saving dictation result:", error);
      return { error: "Failed to save dictation result." };
    }
    return { success: true };
  } catch (error) {
    console.error("Error saving dictation result:", error);
    return { error: "Failed to save dictation result." };
  }
}

export async function saveDocument(userId: string, ocrResult: any, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  const file = formData.get('file') as File;

  if (!file) {
    return { error: "File is missing" };
  }

  try {
    const fileName = `${userId}/${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage.from("documents").upload(fileName, file, { contentType: "image/jpeg" })
    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(fileName)

    const { data: documentData, error: dbError } = await supabase
      .from("documents")
      .insert({ user_id: userId, image_url: publicUrlData.publicUrl, image_path: fileName, recognized_text: { ...ocrResult, newlyFoundItems: undefined } })
      .select("id").single()

    if (dbError) throw dbError

    return { documentId: documentData.id };
  } catch (error) {
    console.error("Error saving document:", error);
    return { error: "Failed to save document." };
  }
}

export async function addToStudyPlanAction(userId: string, documentId: string, items: string[]) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: insertedCount, error } = await supabase.rpc('add_to_study_plan', {
      p_user_id: userId,
      p_document_id: documentId,
      p_items: items,
    });

    if (error) {
      console.error("Error adding to study plan:", error);
      return { error: "Failed to add to study plan." };
    }
    return { insertedCount };
  } catch (error) {
    console.error("Error adding to study plan:", error);
    return { error: "Failed to add to study plan." };
  }
}

export async function updateStudyScheduleAction(itemId: string, updatedSchedule: any) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase
      .from('spaced_repetition_schedule')
      .update(updatedSchedule)
      .eq('id', itemId);

    if (error) {
      console.error("Error updating study schedule:", error);
      return { error: "Failed to update study schedule." };
    }
    return { success: true };
  } catch (error) {
    console.error("Error updating study schedule:", error);
    return { error: "Failed to update study schedule." };
  }
}

export async function saveSelectionsAndCreateReviewsAction(documentId: string, selections: any[], userId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: savedSelections, error } = await supabase
      .from("selections")
      .insert(selections.map(s => ({ document_id: documentId, text: s.text, type: s.type })))
      .select()

    if (error) {
      console.error("Failed to save selections:", error);
      return { error: "Failed to save selections." };
    }

    if (!savedSelections) {
      return { error: "Failed to save selections." };
    }

    // Create review schedule for each new selection
    const reviewSchedules = savedSelections.map(selection => ({
      selection_id: selection.id,
      user_id: userId,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
    }))

    const { error: reviewError } = await supabase.from("reviews").insert(reviewSchedules)

    if (reviewError) {
      console.error("Failed to create review schedules:", reviewError)
      return { error: "Failed to create review schedules." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving selections and reviews:", error);
    return { error: "Failed to save selections and reviews." };
  }
}

export async function getDocumentsPageData() {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "User not found" };
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      return { error: "Failed to fetch documents." };
    }
    return { documents: data, user };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return { error: "Failed to fetch documents." };
  }
}

export async function deleteDocument(documentId: string, userId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase
      .from('documents')
      .update({ is_deleted: true })
      .eq('id', documentId)
      .eq('user_id', userId);

    if (error) {
      console.error("Error deleting document:", error);
      return { error: "Failed to delete document." };
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { error: "Failed to delete document." };
  }
}

export async function getStudyPageData(studySessionItems?: string[]) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "User not found" };
    }

    if (studySessionItems) {
      const { data, error } = await supabase
        .from('spaced_repetition_schedule')
        .select(`
            *,
            text_items!inner(*)
        `)
        .eq('user_id', user.id)
        .in('text_items.content', studySessionItems);

      if (error) {
        console.error("Error fetching study session items:", error);
        return { error: "Failed to fetch study session items." };
      }
      return { items: data, user };
    } else {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("spaced_repetition_schedule")
        .select(`
            *,
            text_items:text_item_id (*)
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .lte("next_review_date", today);

      if (error) {
        console.error("Error fetching due items:", error);
        return { error: "Failed to fetch due items." };
      }
      return { items: data, user };
    }
  } catch (error) {
    console.error("Error fetching study page data:", error);
    return { error: "Failed to fetch study page data." };
  }
}

export async function getDictationPageData() {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "User not found" };
    }

    const { data, error } = await supabase
      .from('text_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching text items:", error);
      return { error: "Failed to fetch text items." };
    }
    return { items: data, user };
  } catch (error) {
    console.error("Error fetching text items:", error);
    return { error: "Failed to fetch text items." };
  }
}

export async function getPageSession() {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  const { data: { session } } = await supabase.auth.getSession();
  const isSupabaseConfigured =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

  return { session, isSupabaseConfigured };
}

export async function getDocumentById(documentId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "User not found" };
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error("Error fetching document:", error);
      return { error: "Failed to fetch document." };
    }
    return { document: data, user };
  } catch (error) {
    console.error("Error fetching document:", error);
    return { error: "Failed to fetch document." };
  }
}

export async function getItemsPageData() {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "User not found" };
    }

    const { data, error } = await supabase
      .from('documents')
      .select('id, created_at, recognized_text')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching documents for items page:", error);
      return { error: "Failed to fetch documents for items page." };
    }
    return { documents: data, user };
  } catch (error) {
    console.error("Error fetching documents for items page:", error);
    return { error: "Failed to fetch documents for items page." };
  }
}

export async function getProfilePageData() {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "User not found" };
    }

    const { data: userProgress } = await supabase.from("user_progress").select("*").eq("user_id", user.id).maybeSingle()
    const today = new Date().toISOString().split("T")[0]
    const { count: dueItemsCount } = await supabase
      .from("spaced_repetition_schedule")
      .select("id", { count: 'exact', head: true })
      .eq("user_id", user.id)
      .eq("is_active", true)
      .lte("next_review_date", today)

    const { data: masteredItemsCount, error: masteredError } = await supabase.rpc('get_mastered_items_count', { p_user_id: user.id });
    if (masteredError) throw masteredError;

    const { data: currentStreak, error: streakError } = await supabase.rpc('get_day_streak', { p_user_id: user.id });
    if (streakError) throw streakError;

    const stats = {
      totalDocuments: userProgress?.total_documents || 0,
      totalItems: userProgress?.total_text_items || 0,
      itemsDue: dueItemsCount || 0,
      masteredItems: masteredItemsCount || 0,
      currentStreak: currentStreak || 0,
      studyTimeHours: Math.round((userProgress?.total_study_time_minutes || 0) / 60),
    };

    return { stats, user };

  } catch (error) {
    console.error("Error fetching profile page data:", error)
    return { error: "Failed to fetch profile page data." };
  }
}