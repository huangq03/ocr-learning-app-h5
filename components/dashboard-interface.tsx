'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, BookOpen, Brain, Trophy, Calendar, Plus, ArrowRight, Clock, Keyboard, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

// This interface no longer needs totalDocuments, as it's passed via props
interface DashboardStats {
  totalItems: number
  itemsDue: number
  masteredItems: number
  currentStreak: number
  studyTimeHours: number
}

interface RecentDocument {
  id: string
  created_at: string
  file_path: string | null
  recognized_text: {
    cleaned_text?: string
  } | null
}

// Props now include the live totalDocuments count from the server
interface DashboardInterfaceProps {
  user: User
  totalDocuments: number
}

export default function DashboardInterface({ user, totalDocuments }: DashboardInterfaceProps) {
  const router = useRouter()
  // totalDocuments is removed from the initial state here
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    itemsDue: 0,
    masteredItems: 0,
    currentStreak: 0,
    studyTimeHours: 0,
  })
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user progress (we no longer need total_documents from here)
        const { data: userProgress } = await supabase.from("user_progress").select("*").eq("user_id", user.id).single()

        // Fetch items due today
        const today = new Date().toISOString().split("T")[0]
        const { data: dueItems } = await supabase
          .from("spaced_repetition_schedule")
          .select("id", { count: 'exact', head: true })
          .eq("user_id", user.id)
          .eq("is_active", true)
          .lte("next_review_date", today)

        // Fetch mastered items
        const { data: masteredItems } = await supabase
          .from("spaced_repetition_schedule")
          .select("id", { count: 'exact', head: true })
          .eq("user_id", user.id)
          .gte("ease_factor", 2.5)
          .gte("repetition_number", 3)

        // Fetch recent documents
        const { data: documents } = await supabase
          .from("documents")
          .select("id, created_at, file_path, recognized_text")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3)

        // Set stats, omitting totalDocuments as it comes from props
        setStats({
          totalItems: userProgress?.total_text_items || 0,
          itemsDue: dueItems?.length || 0,
          masteredItems: masteredItems?.length || 0,
          currentStreak: userProgress?.current_streak_days || 0,
          studyTimeHours: Math.round((userProgress?.total_study_time_minutes || 0) / 60),
        })

        setRecentDocuments(documents || [])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-purple-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-800 mb-2">Learning Dashboard</h1>
            <p className="text-purple-600">Track your progress and continue learning</p>
          </div>
          <Button onClick={() => router.push("/capture")} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Camera className="w-4 h-4 mr-2" />
            Add Document
          </Button>
        </div>

        {/* Stats Grid - Now using totalDocuments from props */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card className="p-4 bg-white shadow-lg border-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-800">{totalDocuments}</div>
                <div className="text-sm text-blue-600">Documents</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-lg border-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-800">{stats.totalItems}</div>
                <div className="text-sm text-purple-600">Total Items</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-lg border-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-800">{stats.itemsDue}</div>
                <div className="text-sm text-red-600">Due Today</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-lg border-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-800">{stats.masteredItems}</div>
                <div className="text-sm text-green-600">Mastered</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-lg border-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-800">{stats.currentStreak}</div>
                <div className="text-sm text-orange-600">Day Streak</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Study Session */}
          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg border-0">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Brain className="w-8 h-8" />
              </div>
              {stats.itemsDue > 0 && (
                <Badge variant="secondary" className="bg-white bg-opacity-20 text-white">
                  {stats.itemsDue} due
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-bold mb-2">Study Session</h3>
            <p className="text-purple-100 mb-4">
              {stats.itemsDue > 0
                ? `Review ${stats.itemsDue} items using spaced repetition`
                : "All caught up! No items due for review today."}
            </p>
            <Button
              onClick={() => router.push("/study")}
              variant="secondary"
              className="w-full bg-white text-purple-600 hover:bg-purple-50"
              disabled={stats.itemsDue === 0}
            >
              {stats.itemsDue > 0 ? (
                <>
                  Start Studying
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                "No Items Due"
              )}
            </Button>
          </Card>

          {/* Dictation Practice */}
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg border-0">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Keyboard className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Dictation Practice</h3>
            <p className="text-blue-100 mb-4">Practice typing and speaking with your saved text items</p>
            <Button
              onClick={() => router.push("/dictation")}
              variant="secondary"
              className="w-full bg-white text-blue-600 hover:bg-blue-50"
              disabled={stats.totalItems === 0}
            >
              {stats.totalItems > 0 ? (
                <>
                  Start Practice
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                "No Items Available"
              )}
            </Button>
          </Card>

          {/* Add Content */}
          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg border-0">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Camera className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Add New Content</h3>
            <p className="text-green-100 mb-4">Capture a new document and extract text for learning</p>
            <Button
                onClick={() => router.push("/capture")}
                variant="secondary"
                className="w-full bg-white text-green-600 hover:bg-green-50"
              >
                Capture New Document
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
          </Card>
        </div>

        {/* Recent Documents */}
        {recentDocuments.length > 0 && (
          <Card className="p-6 bg-white shadow-lg border-0">
            <h3 className="text-xl font-bold text-purple-800 mb-4">Recent Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentDocuments.map((doc) => {
                const title = doc.recognized_text?.cleaned_text?.substring(0, 50) || "Untitled Document";
                return (
                  <div key={doc.id} onClick={() => router.push(`/documents/${doc.id}`)} className="cursor-pointer group">
                    <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden mb-3 group-hover:shadow-md transition-shadow">
                      <img
                        src={doc.file_path || "/placeholder.svg"}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <h4 className="font-medium text-gray-800 group-hover:text-purple-600 transition-colors truncate">
                      {title}
                    </h4>
                    <p className="text-sm text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}