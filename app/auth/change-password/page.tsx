import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

async function changePassword(formData: FormData) {
  "use server"

  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (password !== confirmPassword) {
    redirect("/auth/change-password?error=passwords_do_not_match")
  }

  if (password.length < 6) {
    redirect("/auth/change-password?error=password_too_short")
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    redirect(`/auth/change-password?error=${encodeURIComponent(error.message)}`)
  }

  // Update must_change_password flag using admin client to bypass RLS
  // We use @supabase/supabase-js directly instead of createServerClient to avoid cookies overriding the service role
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("Missing SUPABASE environment variables")
    redirect("/auth/change-password?error=server_configuration_error")
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { error: updateError, data: updateData } = await supabaseAdmin
    .from("users")
    .update({ must_change_password: false })
    .eq("id", user.id)
    .select()

  console.log("Update result:", { updateError, updateData });

  if (updateError) {
    console.error("Error updating user status:", updateError)
    redirect(`/auth/change-password?error=${encodeURIComponent(updateError.message)}`)
  }
  
  // Force session refresh so the updated user metadata is available to middleware
  await supabase.auth.refreshSession()

  redirect("/documents")
}

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  let errorMessage = null
  const resolvedSearchParams = await searchParams

  if (resolvedSearchParams.error === "passwords_do_not_match") {
    errorMessage = "Las contraseñas no coinciden"
  } else if (resolvedSearchParams.error === "password_too_short") {
    errorMessage = "La contraseña debe tener al menos 6 caracteres"
  } else if (resolvedSearchParams.error === "update_failed") {
    errorMessage = "Error al actualizar el estado del usuario"
  } else if (resolvedSearchParams.error) {
    errorMessage = resolvedSearchParams.error
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0038ae]/10 via-background to-[#0038ae]/5 p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-2xl animate-scale-in">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Cronos Logística"
              width={400}
              height={100}
              className="h-16 sm:h-24 w-auto"
              priority
            />
          </div>
          <CardTitle>Cambiar Contraseña</CardTitle>
          <CardDescription>
            Es necesario cambiar tu contraseña para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={changePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                required 
                placeholder="Repite la contraseña"
                minLength={6}
              />
            </div>
            {errorMessage && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            <Button type="submit" className="w-full bg-[#0038ae] hover:bg-[#0038ae]/90">
              Actualizar Contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
