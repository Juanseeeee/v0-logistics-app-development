import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password, role, name } = await request.json()

    // Verify admin permission
    const supabase = await createServerClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", currentUser.id).single()

    if (!userData || !["admin", "owner"].includes(userData.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Create user with admin API (auto-confirmed)
    const supabaseAdmin = await createServerClient(true) // Use service role
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        role,
        name: name || null,
      },
    })

    if (createError) {
      console.error("Error creating user:", createError)
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Insert into users table
    const { error: insertError } = await supabase.from("users").insert({
      id: newUser.user.id,
      email,
      role,
      name: name || null,
    })

    if (insertError) {
      console.error("Error inserting into users table:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: newUser.user })
  } catch (error: any) {
    console.error("Error in create-user API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
