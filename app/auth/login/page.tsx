import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

async function login(formData: FormData) {
  "use server"

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    redirect("/auth/login?error=invalid_credentials")
  }

  if (authData.user) {
    const { data: userData } = await supabase.from("users").select("role").eq("id", authData.user.id).maybeSingle()

    if (!userData || !userData.role) {
      await supabase.auth.signOut()
      redirect("/auth/login?error=no_role")
    }

    // Redirect based on role
    if (userData.role === "documents") {
      redirect("/documents-hub")
    } else if (userData.role === "driver" || userData.role === "company") {
      redirect("/documents")
    } else {
      redirect("/hub")
    }
  }

  redirect("/auth/login?error=unknown")
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  let errorMessage = null

  if (searchParams.error === "no_role") {
    errorMessage = "Tu cuenta no tiene permisos asignados. Contacta al administrador del sistema."
  } else if (searchParams.error === "invalid_credentials") {
    errorMessage = "Email o contraseña incorrectos"
  } else if (searchParams.error === "unknown") {
    errorMessage = "Error al iniciar sesión. Intenta nuevamente."
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
          <CardDescription>Ingresa a tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {errorMessage && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            <Button type="submit" className="w-full bg-[#0038ae] hover:bg-[#0038ae]/90">
              Ingresar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
