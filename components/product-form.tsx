"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function ProductForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const productData = {
        name: formData.name,
        description: formData.description || null,
        active: true,
      }

      const { error } = await supabase.from("products").insert([productData])

      if (error) throw error

      setFormData({
        name: "",
        description: "",
      })
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al agregar producto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Producto</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Ej: Aceite, Combustible, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (Opcional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="Descripción del producto..."
        />
      </div>

      <Button type="submit" className="w-full bg-[#0038ae] hover:bg-[#0038ae]/90" disabled={loading}>
        {loading ? "Agregando..." : "Agregar Producto"}
      </Button>
    </form>
  )
}
