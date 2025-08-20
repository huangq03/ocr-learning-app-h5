import { redirect } from "next/navigation"
import SignUpForm from "@/components/sign-up-form"
import { getPageSession } from "@/lib/actions"

export default async function SignUpPage() {
  const { session, isSupabaseConfigured } = await getPageSession();

  // If Supabase is not configured, show setup message directly
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
        <h1 className="text-2xl font-bold mb-4 text-purple-800">Connect Supabase to get started</h1>
      </div>
    )
  }

  // If user is logged in, redirect to home page
  if (session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 px-4 py-12 sm:px-6 lg:px-8">
      <SignUpForm />
    </div>
  )
}