import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabaseAdmin = await createServerClient({ useServiceRole: true })

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Error deleting user from auth:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const { error: dbError } = await supabaseAdmin.from("users").delete().eq("id", userId)

    if (dbError) {
      console.error("Error deleting user from database:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in delete-user API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
