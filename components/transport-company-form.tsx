"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface TransportCompany {
  id: string
  name: string
  cuit: string | null
  address: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  notes: string | null
  active: boolean
  created_at: string
}

interface TransportCompanyFormProps {
  company?: TransportCompany
  onSuccess?: (company?: TransportCompany) => void
  onCancel?: () => void
}

export function TransportCompanyForm({ company, onSuccess, onCancel }: TransportCompanyFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    cuit: "",
    address: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    notes: "",
  })

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        cuit: company.cuit || "",
        address: company.address || "",
        contact_name: company.contact_name || "",
        contact_phone: company.contact_phone || "",
        contact_email: company.contact_email || "",
        notes: company.notes || "",
      })
    }
  }, [company])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      if (company) {
        const { data, error } = await supabase
          .from("transport_companies")
          .update({
            name: formData.name,
            cuit: formData.cuit || null,
            address: formData.address || null,
            contact_name: formData.contact_name || null,
            contact_phone: formData.contact_phone || null,
            contact_email: formData.contact_email || null,
            notes: formData.notes || null,
          })
          .eq("id", company.id)
          .select()
          .single()

        if (error) throw error

        if (onSuccess) onSuccess(data)
      } else {
        const { error } = await supabase.from("transport_companies").insert([
          {
            name: formData.name,
            cuit: formData.cuit || null,
            address: formData.address || null,
            contact_name: formData.contact_name || null,
            contact_phone: formData.contact_phone || null,
            contact_email: formData.contact_email || null,
            notes: formData.notes || null,
          },
        ])

        if (error) throw error

        // Limpiar formulario solo en modo creación
        setFormData({
          name: "",
          cuit: "",
          address: "",
          contact_name: "",
          contact_phone: "",
          contact_email: "",
          notes: "",
        })

        if (onSuccess) onSuccess()
      }
    } catch (error: any) {
      console.error("Error:", error)
      alert(error.message || `Error al ${company ? "actualizar" : "agregar"} empresa de transporte`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la Empresa *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Transporte Ejemplo SA"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cuit">CUIT</Label>
        <Input
          id="cuit"
          value={formData.cuit}
          onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
          placeholder="30-12345678-9"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Dirección completa"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_name">Contacto</Label>
          <Input
            id="contact_name"
            value={formData.contact_name}
            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            placeholder="Nombre del contacto"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone">Teléfono</Label>
          <Input
            id="contact_phone"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            placeholder="Teléfono del contacto"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_email">Email</Label>
        <Input
          id="contact_email"
          type="email"
          value={formData.contact_email}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          placeholder="email@ejemplo.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notas adicionales"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 bg-transparent"
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" className="flex-1 bg-[#0038ae] hover:bg-[#0038ae]/90" disabled={loading}>
          {loading ? (company ? "Actualizando..." : "Agregando...") : company ? "Guardar Cambios" : "Agregar Empresa"}
        </Button>
      </div>
    </form>
  )
}
