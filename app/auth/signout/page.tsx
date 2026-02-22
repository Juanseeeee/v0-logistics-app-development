"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function SignOutPage() {
  const router = useRouter()

  useEffect(() => {
    async function signOut() {
      const supabase = createClient()

      // Sign out from Supabase
      await supabase.auth.signOut()

      // Redirect to login page
      router.push("/auth/login")
    }

    signOut()
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cerrando sesión...</p>
      </div>
    </div>
  )
}
