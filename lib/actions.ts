"use server"

import { redirect } from "next/navigation"
import { createDatabase } from "./database"

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

  const db = createDatabase()
  const result = await db.signIn(email.toString(), password.toString())
  
  if (result.success) {
    return { success: true }
  }
  
  return { error: result.error }
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

  const db = createDatabase()
  const result = await db.signUp(email.toString(), password.toString())
  
  if (result.success) {
    return { success: result.success }
  }
  
  return { error: result.error }
}

export async function signOut() {
  const db = createDatabase()
  await db.signOut()
  redirect("/auth/login")
}

export async function getDashboardData(userId: string) {
  const db = createDatabase()
  return await db.getDashboardData(userId)
}

export async function saveDictationResult(result: any) {
  const db = createDatabase()
  return await db.saveDictationResult(result)
}

export async function saveDocument(userId: string, ocrResult: any, formData: FormData) {
  const file = formData.get('file') as File;

  if (!file) {
    return { error: "File is missing" }
  }

  const db = createDatabase()
  return await db.saveDocument(userId, ocrResult, file)
}

export async function addToStudyPlanAction(userId: string, documentId: string, items: string[]) {
  const db = createDatabase()
  return await db.addToStudyPlan(userId, documentId, items)
}

export async function updateStudyScheduleAction(itemId: string, updatedSchedule: any) {
  const db = createDatabase()
  return await db.updateStudySchedule(itemId, updatedSchedule)
}

export async function saveSelectionsAndCreateReviewsAction(documentId: string, selections: any[], userId: string) {
  const db = createDatabase()
  return await db.saveSelectionsAndCreateReviews(documentId, selections, userId)
}

export async function getDocumentsPageData() {
  const db = createDatabase()
  
  try {
    const { user } = await db.getUser();
    if (!user) {
      return { error: "User not found" };
    }

    const { documents, error } = await db.getDocuments(user.id);
    if (error) {
      return { error };
    }
    
    return { documents, user };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return { error: "Failed to fetch documents." };
  }
}

export async function deleteDocument(documentId: string, userId: string) {
  const db = createDatabase()
  return await db.deleteDocument(documentId, userId)
}

export async function getStudyPageData(studySessionItems?: string[]) {
  const db = createDatabase()
  
  try {
    const { user } = await db.getUser();
    if (!user) {
      return { error: "User not found" };
    }

    const { items, error } = await db.getStudyPageData(user.id, studySessionItems);
    if (error) {
      return { error };
    }
    
    return { items, user };
  } catch (error) {
    console.error("Error fetching study page data:", error);
    return { error: "Failed to fetch study page data." };
  }
}

export async function getDictationPageData() {
  const db = createDatabase()
  
  try {
    const { user } = await db.getUser();
    if (!user) {
      return { error: "User not found" };
    }

    const { items, error } = await db.getDictationPageData(user.id);
    if (error) {
      return { error };
    }
    
    return { items, user };
  } catch (error) {
    console.error("Error fetching text items:", error);
    return { error: "Failed to fetch text items." };
  }
}

export async function getPageSession() {
  const db = createDatabase()
  const { session } = await db.getSession()
  const isSupabaseConfigured =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

  return { session, isSupabaseConfigured };
}

export async function getDocumentById(documentId: string) {
  const db = createDatabase()
  
  try {
    const { user } = await db.getUser();
    if (!user) {
      return { error: "User not found" };
    }

    const { document, error } = await db.getDocumentById(documentId, user.id);
    if (error) {
      return { error };
    }
    
    return { document, user };
  } catch (error) {
    console.error("Error fetching document:", error);
    return { error: "Failed to fetch document." };
  }
}

export async function getItemsPageData() {
  const db = createDatabase()
  
  try {
    const { user } = await db.getUser();
    if (!user) {
      return { error: "User not found" };
    }

    const { documents, error } = await db.getItemsPageData(user.id);
    if (error) {
      return { error };
    }
    
    return { documents, user };
  } catch (error) {
    console.error("Error fetching documents for items page:", error);
    return { error: "Failed to fetch documents for items page." };
  }
}

export async function getProfilePageData() {
  const db = createDatabase()
  
  try {
    const { user } = await db.getUser();
    if (!user) {
      return { error: "User not found" };
    }

    const { stats, error } = await db.getProfilePageData(user.id);
    if (error) {
      return { error };
    }
    
    return { stats, user };
  } catch (error) {
    console.error("Error fetching profile page data:", error);
    return { error: "Failed to fetch profile page data." };
  }
}