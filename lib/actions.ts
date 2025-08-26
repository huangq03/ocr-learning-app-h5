"use server"

import { redirect } from "next/navigation"
import { createDatabase } from "./database"
import { getIronSession } from "iron-session"
import { sessionOptions } from "./session"
import { cookies } from "next/headers"

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
  
  const cookieStore = await cookies()
  if (result.user) {
    const session = await getIronSession(cookieStore, sessionOptions)
    session.user = result.user
    await session.save()
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
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  session.destroy()
  redirect("/auth/login")
}

export async function getDashboardData() {
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  const user = session.user
  if (!user) {
    return { error: "User not found" }
  }
  const db = createDatabase()
  return await db.getDashboardData(user.id)
}

export async function saveDictationResult(result: any) {
  const db = createDatabase()
  return await db.saveDictationResult(result)
}

export async function saveDocument(ocrResult: any, formData: FormData) {
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  const user = session.user
  if (!user) {
    return { error: "User not found" }
  }

  const file = formData.get('file') as File;

  if (!file) {
    return { error: "File is missing" }
  }

  const db = createDatabase()
  return await db.saveDocument(user.id, ocrResult, file)
}

export async function addToStudyPlanAction(documentId: string, items: string[]) {
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  const user = session.user
  if (!user) {
    return { error: "User not found" }
  }
  const db = createDatabase()
  return await db.addToStudyPlan(user.id, documentId, items)
}

export async function updateStudyScheduleAction(itemId: string, updatedSchedule: any) {
  const db = createDatabase()
  return await db.updateStudySchedule(itemId, updatedSchedule)
}

export async function saveSelectionsAndCreateReviewsAction(documentId: string, selections: any[]) {
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  const user = session.user
  if (!user) {
    return { error: "User not found" }
  }
  const db = createDatabase()
  return await db.saveSelectionsAndCreateReviews(documentId, selections, user.id)
}

export async function getDocumentsPageData() {
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  const user = session.user
  if (!user) {
    return { error: "User not found" }
  }

  const db = createDatabase()
  const { documents, error } = await db.getDocuments(user.id);
  if (error) {
    return { error };
  }
  
  return { documents, user };
}

export async function deleteDocument(documentId: string) {
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  const user = session.user
  if (!user) {
    return { error: "User not found" }
  }
  const db = createDatabase()
  return await db.deleteDocument(documentId, user.id)
}

export async function getStudyPageData(studySessionItems?: string[]) {
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  const user = session.user
  if (!user) {
    return { error: "User not found" }
  }

  const db = createDatabase()
  const { items, error } = await db.getStudyPageData(user.id, studySessionItems);
  if (error) {
    return { error };
  }
  
  return { items, user };
}

export async function getDictationPageData() {
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  const user = session.user
  if (!user) {
    return { error: "User not found" }
  }

  const db = createDatabase()
  const { items, error } = await db.getDictationPageData(user.id);
  if (error) {
    return { error };
  }
  
  return { items, user };
}

export async function getPageSession() {
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  const isSupabaseConfigured =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

  session.user = {id: session.userId}
  return { session, isSupabaseConfigured };
}

export async function getDocumentById(documentId: string) {
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  const user = session.user
  if (!user) {
    return { error: "User not found" }
  }

  const db = createDatabase()
  const { document, error } = await db.getDocumentById(documentId, user.id);
  if (error) {
    return { error };
  }
  
  return { document, user };
}

export async function getItemsPageData() {
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  const user = session.user
  if (!user) {
    return { error: "User not found" }
  }

  const db = createDatabase()
  const { documents, error } = await db.getItemsPageData(user.id);
  if (error) {
    return { error };
  }
  
  return { documents, user };
}

export async function getProfilePageData() {
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  const user = session.user
  if (!user) {
    return { error: "User not found" }
  }

  const db = createDatabase()
  const { stats, error } = await db.getProfilePageData(user.id);
  if (error) {
    return { error };
  }
  
  return { stats, user };
}
