import { Pool, QueryResult } from "pg"
import { Database } from "."
import * as fs from "fs"
import * as path from "path"

// Helper function to get the database URL from environment variables
function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL
}

// Initialize the PostgreSQL connection pool
let pool: Pool | null = null

function initializePool(): Pool {
  if (!pool) {
    const databaseUrl = getDatabaseUrl()
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not set")
    }
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === "production" ? {
        rejectUnauthorized: false,
      } : false,
    })
  }
  return pool
}

export class PostgresDatabase implements Database {
  private pool: Pool

  constructor() {
    this.pool = initializePool()
  }

  // Authentication methods
  async signIn(email: string, password: string) {
    try {
      // In a real implementation, you would hash and compare passwords
      // This is a simplified version for demonstration
      const result = await this.pool.query(
        "SELECT id FROM users WHERE email = $1 AND password = $2",
        [email, password] // In real implementation, use hashed password
      )
      
      if (result.rows.length === 0) {
        return { error: "Invalid email or password" }
      }
      
      // In a real implementation, you would create a session
      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { error: "An unexpected error occurred. Please try again." }
    }
  }

  async signUp(email: string, password: string) {
    try {
      // Check if user already exists
      const existingUser = await this.pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      )
      
      if (existingUser.rows.length > 0) {
        return { error: "User already exists with this email" }
      }
      
      // In a real implementation, you would hash the password
      // This is a simplified version for demonstration
      await this.pool.query(
        "INSERT INTO users (email, password) VALUES ($1, $2)",
        [email, password] // In real implementation, use hashed password
      )
      
      return { success: "Account created successfully." }
    } catch (error) {
      console.error("Sign up error:", error)
      return { error: "An unexpected error occurred. Please try again." }
    }
  }

  async signOut() {
    // In a real implementation, you would invalidate the session
    // This is a no-op in this simplified version
  }

  async getUser() {
    // In a real implementation, you would get the user from the session
    // This is a simplified version for demonstration
    return { user: null }
  }

  async getSession() {
    // In a real implementation, you would get the session
    // This is a simplified version for demonstration
    return { session: null }
  }

  // Document methods
  async getDocuments(userId: string) {
    try {
      const result = await this.pool.query(
        "SELECT * FROM documents WHERE user_id = $1 AND is_deleted = FALSE ORDER BY created_at DESC",
        [userId]
      )
      return { documents: result.rows }
    } catch (error) {
      console.error("Error fetching documents:", error)
      return { error: "Failed to fetch documents." }
    }
  }

  async getDocumentById(documentId: string, userId: string) {
    try {
      const result = await this.pool.query(
        "SELECT * FROM documents WHERE id = $1 AND user_id = $2",
        [documentId, userId]
      )
      
      if (result.rows.length === 0) {
        return { error: "Document not found." }
      }
      
      return { document: result.rows[0] }
    } catch (error) {
      console.error("Error fetching document:", error)
      return { error: "Failed to fetch document." }
    }
  }

  async saveDocument(userId: string, ocrResult: any, file: File) {
    try {
      // In a real implementation, you would save the file to storage
      // and store the file path in the database
      // This is a simplified version for demonstration
      
      const fileName = `${userId}/${Date.now()}.jpg`
      // In a real implementation, save the file to disk or cloud storage
      // const filePath = path.join(process.cwd(), "public", "uploads", fileName)
      // fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()))
      
      const result = await this.pool.query(
        "INSERT INTO documents (user_id, image_url, image_path, recognized_text) VALUES ($1, $2, $3, $4) RETURNING id",
        [userId, `/uploads/${fileName}`, fileName, JSON.stringify(ocrResult)]
      )
      
      return { documentId: result.rows[0].id }
    } catch (error) {
      console.error("Error saving document:", error)
      return { error: "Failed to save document." }
    }
  }

  async deleteDocument(documentId: string, userId: string) {
    try {
      await this.pool.query(
        "UPDATE documents SET is_deleted = TRUE WHERE id = $1 AND user_id = $2",
        [documentId, userId]
      )
      return { success: true }
    } catch (error) {
      console.error("Error deleting document:", error)
      return { error: "Failed to delete document." }
    }
  }

  // Study methods
  async getDashboardData(userId: string) {
    try {
      // Get user progress
      const userProgressResult = await this.pool.query(
        "SELECT * FROM user_progress WHERE user_id = $1",
        [userId]
      )
      const userProgress = userProgressResult.rows[0] || {}

      // Get due items count
      const today = new Date().toISOString().split("T")[0]
      const dueItemsResult = await this.pool.query(
        "SELECT COUNT(*) as count FROM spaced_repetition_schedule WHERE user_id = $1 AND is_active = TRUE AND next_review_date <= $2",
        [userId, today]
      )
      const dueItemsCount = parseInt(dueItemsResult.rows[0]?.count || "0")

      // Get mastered items count (simplified)
      const masteredItemsResult = await this.pool.query(
        "SELECT COUNT(*) as count FROM text_items WHERE user_id = $1 AND is_mastered = TRUE",
        [userId]
      )
      const masteredItemsCount = parseInt(masteredItemsResult.rows[0]?.count || "0")

      // Get current streak (simplified)
      const streakResult = await this.pool.query(
        "SELECT COALESCE(MAX(streak), 0) as streak FROM user_streaks WHERE user_id = $1",
        [userId]
      )
      const currentStreak = parseInt(streakResult.rows[0]?.streak || "0")

      // Get recent documents
      const recentTextItemsResult = await this.pool.query(
        "SELECT document_id, created_at FROM text_items WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
        [userId]
      )
      const recentTextItems = recentTextItemsResult.rows

      let recentDocuments: any[] = []
      if (recentTextItems.length > 0) {
        const recentDocumentIds = [...new Set(recentTextItems.map(item => item.document_id))].slice(0, 3)
        if (recentDocumentIds.length > 0) {
          const documentsResult = await this.pool.query(
            "SELECT id, created_at, recognized_text FROM documents WHERE id = ANY($1) ORDER BY created_at DESC",
            [recentDocumentIds]
          )
          recentDocuments = documentsResult.rows
        }
      }

      const stats = {
        totalDocuments: userProgress.total_documents || 0,
        totalItems: userProgress.total_text_items || 0,
        itemsDue: dueItemsCount,
        masteredItems: masteredItemsCount,
        currentStreak: currentStreak,
        studyTimeHours: Math.round((userProgress.total_study_time_minutes || 0) / 60),
      }

      return { stats, recentDocuments }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      return { error: "Failed to fetch dashboard data." }
    }
  }

  async getStudyPageData(userId: string, studySessionItems?: string[]) {
    try {
      if (studySessionItems && studySessionItems.length > 0) {
        const placeholders = studySessionItems.map((_, i) => `$${i + 2}`).join(",")
        const query = `
          SELECT srs.*, ti.* 
          FROM spaced_repetition_schedule srs
          JOIN text_items ti ON srs.text_item_id = ti.id
          WHERE srs.user_id = $1 AND ti.content IN (${placeholders})
        `
        const values = [userId, ...studySessionItems]
        const result = await this.pool.query(query, values)
        return { items: result.rows }
      } else {
        const today = new Date().toISOString().split("T")[0]
        const result = await this.pool.query(
          `
          SELECT srs.*, ti.content as text_content
          FROM spaced_repetition_schedule srs
          JOIN text_items ti ON srs.text_item_id = ti.id
          WHERE srs.user_id = $1 AND srs.is_active = TRUE AND srs.next_review_date <= $2
          `,
          [userId, today]
        )
        return { items: result.rows }
      }
    } catch (error) {
      console.error("Error fetching study page data:", error)
      return { error: "Failed to fetch study page data." }
    }
  }

  async updateStudySchedule(itemId: string, updatedSchedule: any) {
    try {
      const fields = Object.keys(updatedSchedule)
      const values = Object.values(updatedSchedule)
      const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(", ")
      const query = `UPDATE spaced_repetition_schedule SET ${setClause} WHERE id = $1`
      await this.pool.query(query, [itemId, ...values])
      return { success: true }
    } catch (error) {
      console.error("Error updating study schedule:", error)
      return { error: "Failed to update study schedule." }
    }
  }

  async addToStudyPlan(userId: string, documentId: string, items: string[]) {
    try {
      // This is a simplified version - in a real implementation you would need
      // to handle the creation of text_items and spaced_repetition_schedule records
      let insertedCount = 0
      
      for (const item of items) {
        // Check if text item already exists
        const existingItem = await this.pool.query(
          "SELECT id FROM text_items WHERE content = $1 AND document_id = $2 AND user_id = $3",
          [item, documentId, userId]
        )
        
        let textItemId: string
        if (existingItem.rows.length > 0) {
          textItemId = existingItem.rows[0].id
        } else {
          // Create new text item
          const newItem = await this.pool.query(
            "INSERT INTO text_items (content, document_id, user_id) VALUES ($1, $2, $3) RETURNING id",
            [item, documentId, userId]
          )
          textItemId = newItem.rows[0].id
        }
        
        // Create spaced repetition schedule
        const scheduleResult = await this.pool.query(
          "INSERT INTO spaced_repetition_schedule (text_item_id, user_id, next_review_date, interval_days, ease_factor, repetition_count) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
          [textItemId, userId, new Date(Date.now() + 24 * 60 * 60 * 1000), 1, 2.5, 0]
        )
        
        if (scheduleResult.rowCount && scheduleResult.rowCount > 0) {
          insertedCount++
        }
      }
      
      return { insertedCount }
    } catch (error) {
      console.error("Error adding to study plan:", error)
      return { error: "Failed to add to study plan." }
    }
  }

  async saveSelectionsAndCreateReviews(documentId: string, selections: any[], userId: string) {
    try {
      // Save selections
      const savedSelections = []
      for (const selection of selections) {
        const result = await this.pool.query(
          "INSERT INTO selections (document_id, text, type) VALUES ($1, $2, $3) RETURNING *",
          [documentId, selection.text, selection.type]
        )
        savedSelections.push(result.rows[0])
      }
      
      // Create review schedules
      for (const selection of savedSelections) {
        await this.pool.query(
          "INSERT INTO reviews (selection_id, user_id, due_date) VALUES ($1, $2, $3)",
          [selection.id, userId, new Date(Date.now() + 24 * 60 * 60 * 1000)]
        )
      }
      
      return { success: true }
    } catch (error) {
      console.error("Error saving selections and reviews:", error)
      return { error: "Failed to save selections and reviews." }
    }
  }

  // Dictation methods
  async getDictationPageData(userId: string) {
    try {
      const result = await this.pool.query(
        "SELECT * FROM text_items WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      )
      return { items: result.rows }
    } catch (error) {
      console.error("Error fetching text items:", error)
      return { error: "Failed to fetch text items." }
    }
  }

  async saveDictationResult(result: any) {
    try {
      await this.pool.query(
        "INSERT INTO dictation_exercises (user_id, text, accuracy, wpm, duration) VALUES ($1, $2, $3, $4, $5)",
        [result.userId, result.text, result.accuracy, result.wpm, result.duration]
      )
      return { success: true }
    } catch (error) {
      console.error("Error saving dictation result:", error)
      return { error: "Failed to save dictation result." }
    }
  }

  // Items methods
  async getItemsPageData(userId: string) {
    try {
      const result = await this.pool.query(
        "SELECT id, created_at, recognized_text FROM documents WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      )
      return { documents: result.rows }
    } catch (error) {
      console.error("Error fetching documents for items page:", error)
      return { error: "Failed to fetch documents for items page." }
    }
  }

  // Profile methods
  async getProfilePageData(userId: string) {
    try {
      // Get user progress
      const userProgressResult = await this.pool.query(
        "SELECT * FROM user_progress WHERE user_id = $1",
        [userId]
      )
      const userProgress = userProgressResult.rows[0] || {}

      // Get due items count
      const today = new Date().toISOString().split("T")[0]
      const dueItemsResult = await this.pool.query(
        "SELECT COUNT(*) as count FROM spaced_repetition_schedule WHERE user_id = $1 AND is_active = TRUE AND next_review_date <= $2",
        [userId, today]
      )
      const dueItemsCount = parseInt(dueItemsResult.rows[0]?.count || "0")

      // Get mastered items count (simplified)
      const masteredItemsResult = await this.pool.query(
        "SELECT COUNT(*) as count FROM text_items WHERE user_id = $1 AND is_mastered = TRUE",
        [userId]
      )
      const masteredItemsCount = parseInt(masteredItemsResult.rows[0]?.count || "0")

      // Get current streak (simplified)
      const streakResult = await this.pool.query(
        "SELECT COALESCE(MAX(streak), 0) as streak FROM user_streaks WHERE user_id = $1",
        [userId]
      )
      const currentStreak = parseInt(streakResult.rows[0]?.streak || "0")

      const stats = {
        totalDocuments: userProgress.total_documents || 0,
        totalItems: userProgress.total_text_items || 0,
        itemsDue: dueItemsCount,
        masteredItems: masteredItemsCount,
        currentStreak: currentStreak,
        studyTimeHours: Math.round((userProgress.total_study_time_minutes || 0) / 60),
      }

      return { stats }
    } catch (error) {
      console.error("Error fetching profile page data:", error)
      return { error: "Failed to fetch profile page data." }
    }
  }
}