import { SupabaseDatabase } from "./supabase"
import { PostgresDatabase } from "./postgres"
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

// Database interface that both implementations must conform to
export interface Database {
  // Authentication methods
  signIn: (email: string, password: string, cookies: ReadonlyRequestCookies) => Promise<{ error?: string; success?: boolean }>
  signUp: (email: string, password: string) => Promise<{ error?: string; success?: string }>
  signOut: (cookies: ReadonlyRequestCookies) => Promise<void>
  getUser: (cookies: ReadonlyRequestCookies) => Promise<{ user: any | null; error?: string }>
  getSession: (cookies: ReadonlyRequestCookies) => Promise<{ session: { user: any | null } | null; error?: string }>

  // Document methods
  getDocuments: (userId: string) => Promise<{ documents: any[]; error?: string }>
  getDocumentById: (documentId: string, userId: string) => Promise<{ document: any | null; error?: string }>
  saveDocument: (userId: string, ocrResult: any, file: File) => Promise<{ documentId?: string; error?: string }>
  deleteDocument: (documentId: string, userId: string) => Promise<{ success?: boolean; error?: string }>

  // Study methods
  getDashboardData: (userId: string) => Promise<any>
  getStudyPageData: (userId: string, studySessionItems?: string[]) => Promise<any>
  updateStudySchedule: (itemId: string, updatedSchedule: any) => Promise<{ success?: boolean; error?: string }>
  addToStudyPlan: (userId: string, documentId: string, items: string[]) => Promise<{ insertedCount?: number; error?: string }>
  saveSelectionsAndCreateReviews: (documentId: string, selections: any[], userId: string) => Promise<{ success?: boolean; error?: string }>

  // Dictation methods
  getDictationPageData: (userId: string) => Promise<{ items: any[]; error?: string }>
  saveDictationResult: (result: any) => Promise<{ success?: boolean; error?: string }>

  // Items methods
  getItemsPageData: (userId: string) => Promise<{ documents: any[]; error?: string }>

  // Profile methods
  getProfilePageData: (userId: string) => Promise<any>
}

// Factory function to create the appropriate database implementation
export function createDatabase(): Database {
  const dbType = process.env.DATABASE_TYPE || "supabase"
  
  switch (dbType.toLowerCase()) {
    case "postgres":
      return new PostgresDatabase()
    case "supabase":
    default:
      return new SupabaseDatabase()
  }
}