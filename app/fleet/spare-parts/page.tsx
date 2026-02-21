import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SparePartForm } from "@/components/spare-part-form"
import { SparePartList } from "@/components/spare-part-list"

export default async function SparePartsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: spareParts } = await supabase.from("spare_parts").select("*").order("name", { ascending: true })

  const totalStock = spareParts?.reduce((sum, part) => sum + part.stock_quantity, 0) || 0
  const lowStock = spareParts?.filter((part) => part.stock_quantity > 0 && part.stock_quantity <= 5).length || 0
  const outOfStock = spareParts?.filter((part) => part.stock_quantity === 0).length || 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/fleet" prefetch={false}>
                ← Volver a Flota
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="sm:hidden">
              <Link href="/fleet" prefetch={false}>
                ←
              </Link>
            </Button>
            <div className="h-6 w-px bg-border mx-1 sm:mx-2 hidden sm:block" />
            <h1 className="text-base sm:text-xl font-bold truncate">Gestión de Repuestos</h1>
          </div>
          <Link href="/auth/signout" prefetch={false}>
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">Cerrar Sesión</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Repuestos Propios</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Control de stock y gestión de repuestos</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Repuestos</CardDescription>
              <CardTitle className="text-2xl sm:text-4xl">{spareParts?.length || 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Stock Total</CardDescription>
              <CardTitle className="text-2xl sm:text-4xl">{totalStock}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Unidades disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Stock Bajo</CardDescription>
              <CardTitle className="text-2xl sm:text-4xl text-yellow-500">{lowStock}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">5 o menos unidades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Sin Stock</CardDescription>
              <CardTitle className="text-2xl sm:text-4xl text-red-500">{outOfStock}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Requieren reposición</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Spare Part */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl">Repuestos Disponibles</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Lista completa de repuestos en stock</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-[#0038ae] hover:bg-[#0038ae]/90 w-full sm:w-auto" size="sm">Agregar Repuesto</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo Repuesto</DialogTitle>
                  </DialogHeader>
                  <SparePartForm />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <SparePartList spareParts={spareParts || []} onUpdate={() => {}} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
