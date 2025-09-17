import { Pool, QueryResult, types } from "pg"
import { Database } from "."
import * as fs from "fs"
import * as path from "path"
import * as bcrypt from "bcrypt"
import { sendConfirmationEmail } from "../email"
import crypto from "crypto"

// Helper function to get the database URL from environment variables
function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL
}

// Initialize the PostgreSQL connection pool
let pool: Pool | null = null

function initializePool(): Pool {
  if (!pool) {
    // The pg driver returns numeric types as strings. This converts them to numbers.
    types.setTypeParser(1700, parseFloat)

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
      const result = await this.pool.query(
        "SELECT id, encrypted_password, email_confirmed_at FROM users WHERE email = $1",
        [email]
      )

      if (result.rows.length === 0) {
        return { error: "Invalid email or password" }
      }

      const user = result.rows[0]

      if (!user.email_confirmed_at) {
        return { error: "Please confirm your email address before signing in." }
      }

      const passwordMatches = await bcrypt.compare(password, user.encrypted_password)

      if (!passwordMatches) {
        return { error: "Invalid email or password" }
      }

      return { user: { id: user.id, email: user.email } }
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

      const saltRounds = 10
      const hashedPassword = await bcrypt.hash(password, saltRounds)
      const confirmationToken = crypto.randomBytes(32).toString("hex")

      await this.pool.query(
        "INSERT INTO users (email, encrypted_password, confirmation_token, confirmation_sent_at) VALUES ($1, $2, $3, NOW())",
        [email, hashedPassword, confirmationToken]
      )

      await sendConfirmationEmail(email, confirmationToken)

      return { success: "Account created successfully. Please check your email to confirm your account." }
    } catch (error) {
      console.error("Sign up error:", error)
      return { error: "An unexpected error occurred. Please try again." }
    }
  }

  // Document methods
  async getDocuments(userId: string) {
    try {
      const result = await this.pool.query(
        "SELECT id, name, created_at, recognized_text FROM documents WHERE user_id = $1 AND is_deleted = FALSE ORDER BY created_at DESC",
        [userId]
      );
      return { documents: result.rows };
    } catch (error) {
      console.error("Error fetching documents:", error);
      return { error: "Failed to fetch documents." };
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

  async saveDocument(userId: string, ocrResult: any, file: File, name?: string) {
    try {
      // In a real implementation, you would save the file to storage
      // and store the file path in the database
      // This is a simplified version for demonstration
      
      const fileName = `${userId}/${Date.now()}.jpg`;
      // In a real implementation, save the file to disk or cloud storage
      // const filePath = path.join(process.cwd(), "public", "uploads", fileName)
      // fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()))
      
      const result = await this.pool.query(
        "INSERT INTO documents (user_id, name, image_url, image_path, recognized_text) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [userId, name, `/uploads/${fileName}`, fileName, JSON.stringify(ocrResult)]
      )
      
      return { documentId: result.rows[0].id };
    } catch (error) {
      console.error("Error saving document:", error);
      return { error: "Failed to save document." };
    }
  }

  async updateDocumentName(documentId: string, userId: string, name: string) {
    try {
      await this.pool.query(
        "UPDATE documents SET name = $1 WHERE id = $2 AND user_id = $3",
        [name, documentId, userId]
      );
      return { success: true };
    } catch (error) {
      console.error("Error updating document name:", error);
      return { error: "Failed to update document name." };
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
      const today = new Date().toISOString().split("T")[0]

      const [
        userProgressResult,
        dueItemsResult,
        masteredItemsResult,
        dayStreakResult,
        recentTextItemsResult,
      ] = await Promise.all([
        this.pool.query("SELECT total_documents, total_text_items, total_study_time_minutes FROM user_progress WHERE user_id = $1", [userId]),
        this.pool.query("SELECT COUNT(*) as count FROM spaced_repetition_schedule WHERE user_id = $1 AND is_active = TRUE AND next_review_date <= $2", [userId, today]),
        this.pool.query("SELECT get_mastered_items_count($1) as count", [userId]),
        this.pool.query("SELECT get_day_streak($1) as streak", [userId]),
        this.pool.query("SELECT document_id, created_at FROM text_items WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10", [userId]),
      ])

      const userProgress = userProgressResult.rows[0] || {}
      const dueItemsCount = parseInt(dueItemsResult.rows[0]?.count || "0")
      const masteredItemsCount = masteredItemsResult.rows[0]?.count || 0
      const currentStreak = dayStreakResult.rows[0]?.streak || 0
      const recentTextItems = recentTextItemsResult.rows

      let recentDocuments: any[] = []
      if (recentTextItems.length > 0) {
        const recentDocumentIds = [...new Set(recentTextItems.map(item => item.document_id))].slice(0, 3)
        if (recentDocumentIds.length > 0) {
          const documentsResult = await this.pool.query(`
            SELECT
              d.id as document_id,
              d.name as document_name,
              d.created_at as document_created_at,
              d.recognized_text,
              ti.id as text_item_id,
              ti.content,
              ti.is_mastered,
              w.name as word_name,
              w.american_phonetic_symbol,
              w.english_phonetic_symbol,
              w.en_pronunciation,
              w.us_pronunciation,
              w.explanation
            FROM
              text_items ti
            JOIN
              documents d ON ti.document_id = d.id
            LEFT JOIN
              words w ON ti.word_id = w.id
            WHERE
              d.id = ANY($1) AND ti.user_id = $2 AND d.is_deleted = FALSE
          `, [recentDocumentIds, userId]);

          const groupedByDocument = documentsResult.rows.reduce((acc, row) => {
              const { document_id, document_name, document_created_at, recognized_text, ...item } = row;
              if (!acc[document_id]) {
                  acc[document_id] = {
                      id: document_id,
                      name: document_name,
                      created_at: document_created_at,
                      recognized_text: recognized_text,
                      items: []
                  };
              }
              acc[document_id].items.push(item);
              return acc;
          }, {});

          recentDocuments = Object.values(groupedByDocument).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
      let result: QueryResult;
      const baseQuery = `
        SELECT
          srs.id, -- This is the schedule ID
          srs.repetition_number,
          srs.ease_factor,
          srs.interval_days,
          ti.id as text_item_id,
          ti.content,
          ti.context,
          ti.user_definition,
          w.name as word_name,
          w.american_phonetic_symbol,
          w.english_phonetic_symbol,
          w.en_pronunciation,
          w.us_pronunciation,
          w.explanation
        FROM
          spaced_repetition_schedule srs
        JOIN
          text_items ti ON srs.text_item_id = ti.id
        LEFT JOIN
          words w ON ti.word_id = w.id
      `;

      if (studySessionItems && studySessionItems.length > 0) {
        const placeholders = studySessionItems.map(i => `'${i.content}'`).join(",");
        const query = `${baseQuery} WHERE srs.user_id = $1 AND ti.content IN (${placeholders})`;
        result = await this.pool.query(query, [userId]);
      } else {
        const today = new Date().toISOString().split("T")[0];
        const query = `${baseQuery} WHERE srs.user_id = $1 AND srs.is_active = TRUE AND srs.next_review_date <= $2`;
        result = await this.pool.query(query, [userId, today]);
      }
      return { items: result.rows };
    } catch (error) {
      console.error("Error fetching study page data:", error);
      return { error: "Failed to fetch study page data." };
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

  async signOut() {
    return
  }

  async addToStudyPlan(userId: string, documentId: string, items: string[]) {
    try {
      const result = await this.pool.query(
        "SELECT * FROM add_to_study_plan($1, $2, $3)",
        [userId, documentId, items]
      )
      const insertedItems = result.rows;
      return { insertedItems, insertedCount: insertedItems.length };
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

  // Exercise methods
  async getDictationPageData(userId: string) {
    try {
      const result = await this.pool.query(`
        SELECT
          ti.id as text_item_id,
          ti.content,
          w.*
        FROM
          text_items ti
        LEFT JOIN
          words w ON ti.word_id = w.id
        WHERE
          ti.user_id = $1
        ORDER BY
          ti.created_at DESC;
      `, [userId]);
      return { items: result.rows };
    } catch (error) {
      console.error("Error fetching dictation page data:", error);
      return { error: "Failed to fetch dictation page data." };
    }
  }

  async saveExerciseResult(result: any, exerciseType: 'dictation' | 'recitation') {
    try {
      const {
        user_id,
        text_item_id,
        target_text,
        user_input,
        accuracy_score,
        mistakes_count,
        completion_time_seconds,
        details,
      } = result;

      await this.pool.query(
        "INSERT INTO exercises (user_id, text_item_id, exercise_type, target_text, user_input, accuracy_score, mistakes_count, completion_time_seconds, details, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())",
        [user_id, text_item_id, exerciseType, target_text, user_input, accuracy_score, mistakes_count, completion_time_seconds, details || null]
      )

      // After saving the result, update the is_mastered flag
      if (exerciseType === 'dictation') {
        const isMastered = accuracy_score === 100;
        await this.pool.query(
          'UPDATE text_items SET is_mastered = $1 WHERE id = $2',
          [isMastered, text_item_id]
        );
      }

      //await this.updateUserProgress(result.userId, result.duration / 60000) // Convert ms to minutes
      return { success: true }
    } catch (error) {
      console.error("Error saving exercise result:", error)
      return { error: "Failed to save exercise result." }
    }
  }

  // Items methods
  async getItemsPageData(userId: string, filter?: string | null) {
    try {
      let whereClause = 'WHERE ti.user_id = $1';
      const params: any[] = [userId];

      if (filter === 'mastered') {
        whereClause += ' AND ti.is_mastered = TRUE';
      }

      const query = `
        SELECT
          d.id as document_id,
          d.name as document_name,
          d.created_at as document_created_at,
          d.recognized_text,
          ti.id as text_item_id,
          ti.content,
          ti.is_mastered,
          w.name as word_name,
          w.american_phonetic_symbol,
          w.english_phonetic_symbol,
          w.en_pronunciation,
          w.us_pronunciation,
          w.explanation
        FROM
          text_items ti
        JOIN
          documents d ON ti.document_id = d.id
        LEFT JOIN
          words w ON ti.word_id = w.id
        ${whereClause}
        ORDER BY
          d.created_at DESC, ti.created_at ASC;
      `;

      const result = await this.pool.query(query, params);

      const groupedByDocument = result.rows.reduce((acc, row) => {
          const { document_id, document_name, document_created_at, recognized_text, ...item } = row;
          if (!acc[document_id]) {
              acc[document_id] = {
                  id: document_id,
                  name: document_name,
                  created_at: document_created_at,
                  recognized_text: recognized_text,
                  items: []
              };
          }
          acc[document_id].items.push(item);
          return acc;
      }, {});

      const documents = Object.values(groupedByDocument);
      return { documents };

    } catch (error) {
      console.error("Error fetching items page data:", error);
      return { error: "Failed to fetch items page data." };
    }
  }

  async getTextItemsForDocument(documentId: string, userId: string) {
    try {
      const result = await this.pool.query(
        'SELECT id, content FROM text_items WHERE document_id = $1 AND user_id = $2',
        [documentId, userId]
      );
      return { items: result.rows };
    } catch (error) {
      console.error("Error fetching text items:", error);
      return { error: "Failed to fetch text items." };
    }
  }

  // Share and Tracking methods
  async trackVisit(sharedSetId: string, visitorHash: string) {
    try {
      await this.pool.query(
        'INSERT INTO shared_set_visits (shared_set_id, visitor_hash) VALUES ($1, $2)',
        [sharedSetId, visitorHash]
      );
      await this.pool.query(
        'UPDATE shared_sets SET last_accessed_at = NOW() WHERE id = $1',
        [sharedSetId]
      );
    } catch (error) {
      console.error("Error tracking visit:", error);
      // Fail silently
    }
  }

  async trackEngagement(sharedSetId: string) {
    try {
      await this.pool.query(
        'UPDATE shared_sets SET engagement_count = engagement_count + 1 WHERE id = $1',
        [sharedSetId]
      );
    } catch (error) {
      console.error("Error tracking engagement:", error);
      // Fail silently
    }
  }

  async createSharedSet(userId: string, title: string, itemIds: string[]) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const newSetResult = await client.query(
        'INSERT INTO shared_sets (owner_user_id, title) VALUES ($1, $2) RETURNING id',
        [userId, title]
      );
      const newSetId = newSetResult.rows[0].id;

      const values = itemIds.map(itemId => `('${newSetId}', '${itemId}')`).join(',');
      await client.query(`INSERT INTO shared_set_items (shared_set_id, text_item_id) VALUES ${values}`);
      
      await client.query('COMMIT');
      return { id: newSetId };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Error creating shared set:", error);
      return { error: "Failed to create shared set." };
    } finally {
      client.release();
    }
  }

  async getSharedSet(id: string) {
    try {
      const setResult = await this.pool.query('SELECT id, title, owner_user_id FROM shared_sets WHERE id = $1', [id]);
      if (setResult.rows.length === 0) {
        return { error: "Shared set not found" };
      }
      const set = setResult.rows[0];

      const itemsResult = await this.pool.query(`
        SELECT ti.* 
        FROM text_items ti
        JOIN shared_set_items ssi ON ti.id = ssi.text_item_id
        WHERE ssi.shared_set_id = $1
      `, [id]);

      return { set, items: itemsResult.rows };
    } catch (error) {
      console.error("Error fetching shared set:", error);
      return { error: "Failed to fetch shared set." };
    }
  }

  async getEnrichedDocumentItems(documentId: string, userId: string) {
    try {
      const result = await this.pool.query(`
        SELECT
          ti.id as text_item_id,
          ti.content,
          w.*
        FROM
          text_items ti
        LEFT JOIN
          words w ON ti.word_id = w.id
        WHERE
          ti.document_id = $1 AND ti.user_id = $2
        ORDER BY
          ti.created_at;
      `, [documentId, userId]);
      return { items: result.rows };
    } catch (error) {
      console.error("Error fetching enriched document items:", error);
      return { error: "Failed to fetch enriched document items." };
    }
  }

  async getWordsData(words: string[]) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM words WHERE name = ANY($1)',
        [words]
      );
      return { words: result.rows };
    } catch (error) {
      console.error("Error fetching words data:", error);
      return { error: "Failed to fetch words data." };
    }
  }

  async getShareStats(userId: string) {
    try {
      const result = await this.pool.query(`
        SELECT
            ss.id,
            ss.title,
            ss.engagement_count,
            ss.created_at,
            COUNT(ssv.id) AS total_views,
            COUNT(DISTINCT ssv.visitor_hash) AS unique_visitors
        FROM
            shared_sets ss
        LEFT JOIN
            shared_set_visits ssv ON ss.id = ssv.shared_set_id
        WHERE
            ss.owner_user_id = $1
        GROUP BY
            ss.id
        ORDER BY
            ss.created_at DESC;
      `, [userId]);
      return { stats: result.rows };
    } catch (error) {
      console.error("Error fetching share stats:", error);
      return { error: "Failed to fetch share stats." };
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

      const stats = {
        totalDocuments: userProgress.total_documents || 0,
        totalItems: userProgress.total_text_items || 0,
        itemsDue: dueItemsCount,
        masteredItems: userProgress.items_mastered || 0,
        currentStreak: userProgress.current_streak_days || 0,
        studyTimeHours: Math.round((userProgress.total_study_time_minutes || 0) / 60),
      }

      return { stats }
    } catch (error) {
      console.error("Error fetching profile page data:", error)
      return { error: "Failed to fetch profile page data." }
    }
  }

  
}
