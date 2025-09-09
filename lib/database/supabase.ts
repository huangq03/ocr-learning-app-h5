import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Database } from "."
import { isSupabaseConfigured } from "../supabase/server"

export class SupabaseDatabase implements Database {
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { error: "An unexpected error occurred. Please try again." }
    }
  }

  async signUp(email: string, password: string) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
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

  async signOut() {
    if (!isSupabaseConfigured) {
      return
    }

    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    await supabase.auth.signOut()
  }

  async getUser() {
    if (!isSupabaseConfigured) {
      return { user: null }
    }

    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        return { user: null, error: error.message }
      }
      return { user }
    } catch (error) {
      console.error("Get user error:", error)
      return { user: null, error: "Failed to get user." }
    }
  }

  async getSession() {
    if (!isSupabaseConfigured) {
      return { session: null }
    }

    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        return { session: null, error: error.message }
      }
      return { session }
    } catch (error) {
      console.error("Get session error:", error)
      return { session: null, error: "Failed to get session." }
    }
  }

  async getDashboardData(userId: string) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

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

  async saveExerciseResult(result: any, exerciseType: 'dictation' | 'recitation') {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    try {
      const { error } = await supabase.rpc('save_exercise_and_update_mastery', {
        p_user_id: result.user_id,
        p_text_item_id: result.text_item_id,
        p_exercise_type: exerciseType,
        p_target_text: result.target_text,
        p_user_input: result.user_input,
        p_accuracy_score: result.accuracy_score,
        p_mistakes_count: result.mistakes_count,
        p_completion_time_seconds: result.completion_time_seconds,
        p_details: result.details || null
      });

      if (error) {
        console.error("Error saving exercise result:", error);
        return { error: "Failed to save exercise result." };
      }
      return { success: true };
    } catch (error) {
      console.error("Error saving exercise result:", error);
      return { error: "Failed to save exercise result." };
    }
  }

  async saveDocument(userId: string, ocrResult: any, file: File) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

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

  async addToStudyPlan(userId: string, documentId: string, items: string[]) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

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

  async updateStudySchedule(itemId: string, updatedSchedule: any) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

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

  async saveSelectionsAndCreateReviews(documentId: string, selections: any[], userId: string) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

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
        return { error: "Failed to create review schedules." }
      }

      return { success: true };
    } catch (error) {
      console.error("Error saving selections and reviews:", error);
      return { error: "Failed to save selections and reviews." };
    }
  }

  async getDocuments(userId: string) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error);
        return { error: "Failed to fetch documents." };
      }
      return { documents: data };
    } catch (error) {
      console.error("Error fetching documents:", error);
      return { error: "Failed to fetch documents." };
    }
  }

  async deleteDocument(documentId: string, userId: string) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

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

  async getStudyPageData(userId: string, studySessionItems?: string[]) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    try {
      let query = supabase
        .from('spaced_repetition_schedule')
        .select(`
          id, -- This is the schedule ID
          repetition_number,
          ease_factor,
          interval_days,
          text_items:text_item_id (
            id,
            content,
            context,
            user_definition,
            words (*)
          )
        `)
        .eq("user_id", userId);

      if (studySessionItems && studySessionItems.length > 0) {
        query = query.in('text_items.content', studySessionItems);
      } else {
        const today = new Date().toISOString().split("T")[0];
        query = query.eq("is_active", true).lte("next_review_date", today);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching study page data:", error);
        return { error: "Failed to fetch study page data." };
      }
      
      // The data structure from Supabase is nested. We need to flatten it.
      const flattenedItems = data.map(item => ({
        ...item,
        content: item.text_items.content,
        ...(item.text_items.words || {})
      }));

      return { items: flattenedItems };
    } catch (error) {
      console.error("Error fetching study page data:", error);
      return { error: "Failed to fetch study page data." };
    }
  }

  async getDictationPageData(userId: string) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    try {
      const { data, error } = await supabase
        .from('text_items')
        .select(`
          id,
          content,
          words (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching dictation page data:", error);
        return { error: "Failed to fetch dictation page data." };
      }
      
      const flattenedItems = data.map(item => ({
        ...item,
        ...(item.words || {})
      }));

      return { items: flattenedItems };
    } catch (error) {
      console.error("Error fetching dictation page data:", error);
      return { error: "Failed to fetch dictation page data." };
    }
  }

  async getDocumentById(documentId: string, userId: string) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error("Error fetching document:", error);
        return { error: "Failed to fetch document." };
      }
      return { document: data };
    } catch (error) {
      console.error("Error fetching document:", error);
      return { error: "Failed to fetch document." };
    }
  }

  async getItemsPageData(userId: string, filter?: string | null) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" };
    }

    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    try {
      let query = supabase
        .from('text_items')
        .select(`
          document_id,
          documents ( created_at, recognized_text ),
          text_item_id:id,
          content,
          is_mastered,
          words (*)
        `)
        .eq('user_id', userId);

      if (filter === 'mastered') {
        query = query.eq('is_mastered', true);
      }

      const { data: items, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching items page data:", error);
        return { error: "Failed to fetch items page data." };
      }

      const groupedByDocument = items.reduce((acc, item) => {
        const docId = item.document_id;
        if (!acc[docId]) {
          acc[docId] = {
            id: docId,
            created_at: item.documents.created_at,
            recognized_text: item.documents.recognized_text,
            items: []
          };
        }
        // Flatten the word data into the item
        const enrichedItem = { ...item, ...(item.words || {}) };
        delete enrichedItem.words; // clean up nested object
        delete enrichedItem.documents; // clean up nested object
        acc[docId].items.push(enrichedItem);
        return acc;
      }, {});

      const documents = Object.values(groupedByDocument).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { documents };
    } catch (error) {
      console.error("Error fetching items page data:", error);
      return { error: "Failed to fetch items page data." };
    }
  }

  async getProfilePageData(userId: string) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" }
    }

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

      const stats = {
        totalDocuments: userProgress?.total_documents || 0,
        totalItems: userProgress?.total_text_items || 0,
        itemsDue: dueItemsCount || 0,
        masteredItems: masteredItemsCount || 0,
        currentStreak: currentStreak || 0,
        studyTimeHours: Math.round((userProgress?.total_study_time_minutes || 0) / 60),
      };

      return { stats };

    } catch (error) {
      console.error("Error fetching profile page data:", error)
      return { error: "Failed to fetch profile page data." };
    }
  }

  async getTextItemsForDocument(documentId: string, userId: string) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured" };
    }

    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    try {
      const { data, error } = await supabase
        .from('text_items')
        .select('id, content')
        .eq('document_id', documentId)
        .eq('user_id', userId);

      if (error) {
        console.error("Error fetching text items:", error);
        return { error: "Failed to fetch text items." };
      }
      return { items: data };
    } catch (error) {
      console.error("Error fetching text items:", error);
      return { error: "Failed to fetch text items." };
    }
  }

  // Share and Tracking methods
  async trackVisit(sharedSetId: string, visitorHash: string) {
    if (!isSupabaseConfigured) return;
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    try {
      await supabase.from('shared_set_visits').insert({ shared_set_id: sharedSetId, visitor_hash: visitorHash });
      await supabase.from('shared_sets').update({ last_accessed_at: new Date().toISOString() }).eq('id', sharedSetId);
    } catch (error) {
      console.error("Error tracking visit:", error);
    }
  }

  async trackEngagement(sharedSetId: string) {
    if (!isSupabaseConfigured) return;
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    try {
      const { error } = await supabase.rpc('increment_engagement_count', { set_id: sharedSetId });
      if (error) {
        console.error("Error tracking engagement:", error);
      }
    } catch (error) {
      console.error("Error tracking engagement:", error);
    }
  }

  async createSharedSet(userId: string, title: string, itemIds: string[]) {
    if (!isSupabaseConfigured) return { error: "Supabase is not configured" };
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    try {
      const { data, error } = await supabase.rpc('create_shared_set_and_link_items', {
        p_user_id: userId,
        p_title: title,
        p_item_ids: itemIds
      });

      if (error) {
        console.error("Error creating shared set:", error);
        return { error: "Failed to create shared set." };
      }
      return { id: data };
    } catch (error) {
      console.error("Error creating shared set:", error);
      return { error: "Failed to create shared set." };
    }
  }

  async getSharedSet(id: string) {
    if (!isSupabaseConfigured) return { error: "Supabase is not configured" };
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    try {
      const { data: set, error: setError } = await supabase
        .from('shared_sets')
        .select('id, title, owner_user_id')
        .eq('id', id)
        .single();

      if (setError) {
        console.error("Error fetching shared set:", setError);
        return { error: "Shared set not found" };
      }

      const { data: items, error: itemsError } = await supabase
        .from('shared_set_items')
        .select('text_items(*)')
        .eq('shared_set_id', id);

      if (itemsError) {
        console.error("Error fetching shared set items:", itemsError);
        return { error: "Failed to fetch items for shared set." };
      }

      return { set, items: items.map(i => i.text_items) };
    } catch (error) {
      console.error("Error fetching shared set:", error);
      return { error: "Failed to fetch shared set." };
    }
  }

  async getEnrichedDocumentItems(documentId: string, userId: string) {
    if (!isSupabaseConfigured) return { error: "Supabase is not configured" };
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    try {
      const { data, error } = await supabase
        .from('text_items')
        .select(`
          text_item_id:id,
          content,
          words (*)
        `)
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .order('created_at');

      if (error) {
        console.error("Error fetching enriched document items:", error);
        return { error: "Failed to fetch enriched document items." };
      }
      return { items: data };
    } catch (error) {
      console.error("Error fetching enriched document items:", error);
      return { error: "Failed to fetch enriched document items." };
    }
  }

  async getShareStats(userId: string) {
    if (!isSupabaseConfigured) return { error: "Supabase is not configured" };
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    try {
      const { data, error } = await supabase.rpc('get_user_share_stats', { p_user_id: userId });

      if (error) {
        console.error("Error fetching share stats:", error);
        return { error: "Failed to fetch share stats." };
      }
      return { stats: data };
    } catch (error) {
      console.error("Error fetching share stats:", error);
      return { error: "Failed to fetch share stats." };
    }
  }
}