import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const supabase = await createClient()

  // Sign out from Supabase (clears cookies)
  await supabase.auth.signOut()

  // Redirect to login page using 303 See Other (Post/Redirect/Get pattern)
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`, {
    status: 303,
  })
}

// Handle GET requests by redirecting to login
// This covers cases where users might navigate manually or if a link was clicked
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
}
