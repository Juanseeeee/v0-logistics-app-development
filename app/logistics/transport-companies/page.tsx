import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TransportCompanyList } from "@/components/transport-company-list"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2, Plus } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TransportCompanyForm } from "@/components/transport-company-form"

export default async function TransportCompaniesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: companies } = await supabase.from("transport_companies").select("*").eq("active", true).order("name")

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/logistics">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#0038ae] p-2">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Empresas de Transporte</h1>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#0038ae] hover:bg-[#0038ae]/90">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Empresa de Transporte</DialogTitle>
                <DialogDescription>Agregar una nueva empresa de transporte al sistema</DialogDescription>
              </DialogHeader>
              <TransportCompanyForm />
            </DialogContent>
          </Dialog>
        </div>

        <TransportCompanyList companies={companies || []} />
      </div>
    </div>
  )
}
