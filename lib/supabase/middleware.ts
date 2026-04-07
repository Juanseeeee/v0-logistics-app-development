import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ["/hub", "/fleet", "/finance", "/logistics", "/documents", "/documents-hub", "/admin"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Role-based restrictions
  if (user && isProtectedPath) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
      
    const role = userData?.role

    // Driver can only access /documents
    if (role === "driver") {
      if (!request.nextUrl.pathname.startsWith("/documents")) {
        const url = request.nextUrl.clone()
        url.pathname = "/documents"
        return NextResponse.redirect(url)
      }
    }
  }

  // If user is logged in and tries to access login page, redirect appropriately
  if (request.nextUrl.pathname === "/auth/login" && user) {
    const url = request.nextUrl.clone()
    
    // Check role for login redirect
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
      
    if (userData?.role === "driver" || userData?.role === "company") {
      url.pathname = "/documents"
    } else if (userData?.role === "documents") {
      url.pathname = "/documents-hub"
    } else {
      url.pathname = "/hub"
    }
    
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
