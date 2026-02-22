import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ExpenseList } from "@/components/expense-list"

export default async function ExpensesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  // Get user role
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

  const userRole = profile?.role

  // Check permissions
  if (userRole !== "admin" && userRole !== "owner" && userRole !== "manager") {
    redirect("/hub")
  }

  // Get all expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select(`
      *,
      suppliers (
        id,
        name
      )
    `)
    .order("date", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/finance" prefetch={false}>
                ← Volver a Finanzas
              </Link>
            </Button>
            <div className="h-6 w-px bg-border mx-2" />
            <h1 className="text-xl font-bold">Control de Gastos</h1>
          </div>
          <Link href="/auth/signout" prefetch={false}>
            <Button variant="ghost">Cerrar Sesión</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <ExpenseList expenses={expenses || []} userRole={userRole} />
      </div>
    </div>
  )
}
