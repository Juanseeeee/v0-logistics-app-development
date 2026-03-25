"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Search, MapPin, Users, Car, FileText, LayoutDashboard, PlusCircle } from "lucide-react"

export function GlobalCommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Ctrl+K to open palette
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      // Ctrl+F to go to clients
      if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        router.push("/logistics/clients")
        setOpen(false)
      }
      // We can add Ctrl+S inside specific forms, but we can also have a generic action here
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [router])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Búsqueda global">
      <CommandInput placeholder="Escribe un comando o busca..." />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
        <CommandGroup heading="Accesos Rápidos">
          <CommandItem onSelect={() => runCommand(() => router.push("/logistics/l2-trips"))}>
            <MapPin className="mr-2 h-4 w-4" />
            <span>Viajes (L2)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/logistics/clients"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Clientes</span>
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+F</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/fleet/vehicles"))}>
            <Car className="mr-2 h-4 w-4" />
            <span>Vehículos</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/documents"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Documentos</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Acciones">
          <CommandItem onSelect={() => runCommand(() => router.push("/logistics/l2-trips?action=new"))}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Nuevo Viaje L2</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Sistema">
          <CommandItem onSelect={() => runCommand(() => router.push("/hub"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Hub Central</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
