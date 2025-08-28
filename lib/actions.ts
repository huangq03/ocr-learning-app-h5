"use server"

import { redirect } from "next/navigation"
import { createDatabase } from "./database"
import { cookies } from "next/headers"
import { encrypt, getSession } from "./jwt"

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

  if (result.error) {
    return { error: result.error }
  }

  // Create the session
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  const session = await encrypt({ user: result.user, expires })

  // Save the session in a cookie
  const cookie = await cookies()
  cookie.set("session", session, { expires, httpOnly: true })

  redirect("/dashboard")
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
  // Destroy the session
  const cookie = await cookies()
  cookie.set("session", "", { expires: new Date(0) })

  const db = createDatabase()
  await db.signOut()
  redirect("/auth/login")
}

async function getUser() {
  const session = await getSession()
  if (!session?.user) {
    redirect("/auth/login")
  }
  return session.user
}

export async function getDashboardData() {
  const user = await getUser()
  const db = createDatabase()
  return await db.getDashboardData(user.id)
}

export async function saveExerciseResult(result: any, exerciseType: 'dictation' | 'recitation') {
  const db = createDatabase()
  return await db.saveExerciseResult(result, exerciseType)
}

export async function saveDocument(ocrResult: any, formData: FormData) {
  const user = await getUser()
  const file = formData.get("file") as File

  if (!file) {
    return { error: "File is missing" }
  }

  const db = createDatabase()
  return await db.saveDocument(user.id, ocrResult, file)
}

export async function addToStudyPlanAction(documentId: string, items: string[]) {
  const user = await getUser()
  const db = createDatabase()
  return await db.addToStudyPlan(user.id, documentId, items)
}

export async function updateStudyScheduleAction(
  itemId: string,
  updatedSchedule: any
) {
  const db = createDatabase()
  return await db.updateStudySchedule(itemId, updatedSchedule)
}

export async function saveSelectionsAndCreateReviewsAction(
  documentId: string,
  selections: any[]
) {
  const user = await getUser()
  const db = createDatabase()
  return await db.saveSelectionsAndCreateReviews(documentId, selections, user.id)
}

export async function getDocumentsPageData() {
  const user = await getUser()
  const db = createDatabase()
  const { documents, error } = await db.getDocuments(user.id)
  if (error) {
    return { error }
  }

  return { documents, user }
}

export async function deleteDocument(documentId: string) {
  const user = await getUser()
  const db = createDatabase()
  return await db.deleteDocument(documentId, user.id)
}

export async function getStudyPageData(studySessionItems?: string[]) {
  const user = await getUser()
  const db = createDatabase()
  const { items, error } = await db.getStudyPageData(user.id, studySessionItems)
  if (error) {
    return { error }
  }

  return { items, user }
}

export async function getDictationPageData() {
  const user = await getUser()
  const db = createDatabase()
  const { items, error } = await db.getDictationPageData(user.id)
  if (error) {
    return { error }
  }

  return { items, user }
}

export async function getPageSession() {
  const isSupabaseConfigured =
      typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
      typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

  const session = await getSession()
  return { session, isSupabaseConfigured }
}

export async function getDocumentById(documentId: string) {
  const user = await getUser()
  const db = createDatabase()
  const { document, error } = await db.getDocumentById(documentId, user.id)
  if (error) {
    return { error }
  }

  return { document, user }
}

export async function getItemsPageData() {
  const user = await getUser()
  const db = createDatabase()
  const { documents, error } = await db.getItemsPageData(user.id)
  if (error) {
    return { error }
  }

  return { documents, user }
}

export async function getProfilePageData() {
  const user = await getUser()
  const db = createDatabase()
  const { stats, error } = await db.getProfilePageData(user.id)
  if (error) {
    return { error }
  }

  return { stats, user }
}
