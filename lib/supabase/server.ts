import { createServerClient as createServerClientSSR } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createServerClient(useServiceRole = false) {
  const cookieStore = await cookies()

  // Use service role key for admin operations, anon key for regular operations
  const supabaseKey = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClientSSR(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

export async function createClient() {
  return createServerClient()
}
