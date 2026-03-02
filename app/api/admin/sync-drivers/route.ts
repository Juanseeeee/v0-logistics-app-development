import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
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

    // Get all drivers without user_id
    const { data: drivers, error: driversError } = await supabase
      .from("drivers")
      .select("*")
      .is("user_id", null)
      .eq("active", true)

    if (driversError) {
      return NextResponse.json({ error: driversError.message }, { status: 400 })
    }

    if (!drivers || drivers.length === 0) {
      return NextResponse.json({ message: "No hay choferes pendientes de sincronización" })
    }

    const supabaseAdmin = await createServerClient(true) // Use service role
    const results = []

    for (const driver of drivers) {
      if (!driver.cuit) {
        results.push({ id: driver.id, status: "skipped", reason: "No CUIT" })
        continue
      }

      const cleanCuit = driver.cuit.replace(/[^0-9]/g, "")
      const email = `${cleanCuit}@choferes.cronos`
      const password = cleanCuit
      
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .single()
        
      let userId = existingUser?.id

      if (!userId) {
        // Create auth user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role: "driver",
            name: driver.name,
            cuit: driver.cuit
          },
        })

        if (createError) {
          results.push({ id: driver.id, status: "error", reason: createError.message })
          continue
        }
        
        userId = newUser.user.id
        
        // Insert into public.users
        const { error: insertError } = await supabaseAdmin.from("users").insert({
          id: userId,
          email,
          role: "driver",
          name: driver.name,
          must_change_password: true
        })
        
        if (insertError) {
           // If insert fails (maybe already exists in public.users but not linked), try to update
           const { error: updateError } = await supabaseAdmin.from("users").update({
             role: "driver",
             must_change_password: true
           }).eq("id", userId)
           
           if (updateError) {
             results.push({ id: driver.id, status: "error", reason: `User insert failed: ${insertError.message}` })
             continue
           }
        }
      } else {
          // Update existing user to ensure role and must_change_password
          await supabaseAdmin.from("users").update({
             role: "driver",
             must_change_password: true
           }).eq("id", userId)
      }

      // Link driver to user
      const { error: linkError } = await supabaseAdmin
        .from("drivers")
        .update({ user_id: userId })
        .eq("id", driver.id)

      if (linkError) {
        results.push({ id: driver.id, status: "error", reason: `Link failed: ${linkError.message}` })
      } else {
        results.push({ id: driver.id, status: "success", email })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error("Error in sync-drivers API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
