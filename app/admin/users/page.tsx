import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UserManagement } from "@/components/user-management"
import { canManageUsers } from "@/lib/auth/roles"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function UsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  if (!userData || !canManageUsers(userData.role)) {
    redirect("/hub")
  }

  // Obtener todos los usuarios
  const { data: users } = await supabase
    .from("users")
    .select("id, email, role, name, created_at")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/hub">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Hub
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-full bg-[#0038ae] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Administración de Usuarios</h1>
          </div>
          <form action="/auth/signout" method="post">
            <Button variant="ghost" type="submit">
              Cerrar Sesión
            </Button>
          </form>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <UserManagement initialUsers={users || []} />
      </div>
    </div>
  )
}
