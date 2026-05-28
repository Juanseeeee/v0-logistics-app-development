import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ALLOWED_ROLES = ["admin", "owner", "manager"]

export async function POST(request: Request) {
  try {
    const { driverId } = await request.json()

    if (!driverId) {
      return NextResponse.json({ error: "El ID del chofer es obligatorio" }, { status: 400 })
    }

    const supabase = await createServerClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: currentUserData, error: currentUserError } = await supabase
      .from("users")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle()

    if (currentUserError) {
      return NextResponse.json({ error: currentUserError.message }, { status: 400 })
    }

    if (!currentUserData || !ALLOWED_ROLES.includes(currentUserData.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id, name, cuit, user_id")
      .eq("id", driverId)
      .maybeSingle()

    if (driverError) {
      return NextResponse.json({ error: driverError.message }, { status: 400 })
    }

    if (!driver) {
      return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 })
    }

    const cleanCuit = String(driver.cuit || "").replace(/[^0-9]/g, "")

    if (cleanCuit.length !== 11) {
      return NextResponse.json({ error: "El chofer no tiene un CUIT valido de 11 digitos" }, { status: 400 })
    }

    const email = `${cleanCuit}@choferes.cronos`
    const temporaryPassword = cleanCuit
    const supabaseAdmin = await createServerClient(true)

    let userId = driver.user_id as string | null

    if (!userId) {
      const { data: existingUser, error: existingUserError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle()

      if (existingUserError) {
        return NextResponse.json({ error: existingUserError.message }, { status: 400 })
      }

      userId = existingUser?.id ?? null
    }

    if (!userId) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          role: "driver",
          name: driver.name,
          cuit: cleanCuit,
        },
      })

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 })
      }

      userId = newUser.user.id
    } else {
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: temporaryPassword,
        user_metadata: {
          role: "driver",
          name: driver.name,
          cuit: cleanCuit,
        },
      })

      if (updateAuthError) {
        return NextResponse.json({ error: updateAuthError.message }, { status: 400 })
      }
    }

    const { error: upsertUserError } = await supabaseAdmin.from("users").upsert(
      {
        id: userId,
        email,
        role: "driver",
        name: driver.name,
        must_change_password: true,
      },
      { onConflict: "id" },
    )

    if (upsertUserError) {
      return NextResponse.json({ error: upsertUserError.message }, { status: 400 })
    }

    if (driver.user_id !== userId) {
      const { error: linkError } = await supabaseAdmin.from("drivers").update({ user_id: userId }).eq("id", driver.id)

      if (linkError) {
        return NextResponse.json({ error: linkError.message }, { status: 400 })
      }
    }

    return NextResponse.json({
      success: true,
      driverId: driver.id,
      driverName: driver.name,
      loginIdentifier: cleanCuit,
      temporaryPassword,
      message: "Contrasena restablecida correctamente",
    })
  } catch (error: any) {
    console.error("Error in reset-driver-password API:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
