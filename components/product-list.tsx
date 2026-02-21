"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Trash2 } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string | null
  active: boolean
}

export function ProductList({ products }: { products: Product[] }) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({ name: "", description: "" })
  const [saving, setSaving] = useState(false)

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setToggling(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("products").update({ active: !currentStatus }).eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar producto")
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return

    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar producto")
    } finally {
      setDeleting(null)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setEditFormData({
      name: product.name,
      description: product.description || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingProduct) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("products")
        .update({
          name: editFormData.name,
          description: editFormData.description || null,
        })
        .eq("id", editingProduct.id)

      if (error) throw error

      setIsEditDialogOpen(false)
      setEditingProduct(null)
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar producto")
    } finally {
      setSaving(false)
    }
  }

  if (products.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <p className="text-center py-12 text-muted-foreground">No hay productos registrados</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-semibold">Nombre</th>
              <th className="text-left p-4 font-semibold">Descripción</th>
              <th className="text-left p-4 font-semibold">Estado</th>
              <th className="text-right p-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t hover:bg-muted/50">
                <td className="p-4 font-medium">{product.name}</td>
                <td className="p-4 text-muted-foreground">{product.description || "-"}</td>
                <td className="p-4">
                  <Badge variant={product.active ? "default" : "secondary"}>
                    {product.active ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant={product.active ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleActive(product.id, product.active)}
                      disabled={toggling === product.id}
                      className={!product.active ? "bg-[#0038ae] hover:bg-[#0038ae]/90" : ""}
                    >
                      {toggling === product.id ? "..." : product.active ? "Desactivar" : "Activar"}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                      disabled={deleting === product.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre del Producto</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción (Opcional)</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !editFormData.name}
              className="w-full bg-[#0038ae] hover:bg-[#0038ae]/90"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
