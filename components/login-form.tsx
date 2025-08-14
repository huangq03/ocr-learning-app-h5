"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2, Camera } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { signIn } from "@/lib/actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-purple-800 hover:bg-purple-700 text-white py-6 text-lg font-medium rounded-xl h-[60px] transition-all duration-200 transform hover:scale-105"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign In"
      )}
    </Button>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(signIn, null)

  // Handle successful login by redirecting
  useEffect(() => {
    if (state?.success) {
      router.push("/")
    }
  }, [state, router])

  return (
    <Card className="w-full max-w-md p-8 bg-white shadow-xl border-0">
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
            <Camera className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-purple-800">Welcome back</h1>
          <p className="text-lg text-purple-600">Sign in to your OCR learning account</p>
        </div>

        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{state.error}</div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-purple-700">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="bg-purple-50 border-purple-200 text-purple-900 placeholder:text-purple-400 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-purple-700">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-purple-50 border-purple-200 text-purple-900 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>

          <SubmitButton />

          <div className="text-center text-purple-600">
            Don't have an account?{" "}
            <Link href="/auth/sign-up" className="text-purple-800 hover:underline font-semibold">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </Card>
  )
}
