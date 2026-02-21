import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { canAccessFinance } from "@/lib/auth/roles"
import { PurchaseOrderList } from "@/components/purchase-order-list"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function PurchaseOrdersPage() {
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

  if (!canAccessFinance(userRole)) {
    redirect("/hub")
  }

  // Get purchase orders with items
  const { data: purchaseOrders } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      suppliers (
        id,
        name,
        cuit
      ),
      purchase_order_items (
        id,
        item_number,
        code,
        description,
        quantity,
        unit_price,
        total_item
      )
    `)
    .order("created_at", { ascending: false })

  // Get suppliers for the form
  const { data: suppliers } = await supabase.from("suppliers").select("*").eq("active", true).order("name")

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
            <h1 className="text-xl font-bold">Órdenes de Compra</h1>
          </div>
          <Link href="/auth/signout" prefetch={false}>
            <Button variant="ghost">Cerrar Sesión</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <PurchaseOrderList purchaseOrders={purchaseOrders || []} suppliers={suppliers || []} userRole={userRole} />
      </div>
    </div>
  )
}
