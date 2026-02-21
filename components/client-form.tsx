"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface Product {
  id: string
  name: string
}

interface ClientFormProps {
  products: Product[]
  client?: {
    id: string
    company: string
    cuit: string | null
    location: string | null
    contact_name: string | null
    contact_phone: string | null
    contact_email: string | null
    commercial_contact_name: string | null
    commercial_contact_phone: string | null
    logistics_contact_name: string | null
    logistics_contact_phone: string | null
    address: string | null
    sale_condition: string | null
    document_type: string | null
    taxpayer_type: string | null
    responsibles: string | null
    comments: string | null
    client_products?: Array<{ product_id: string }>
  }
  onSuccess?: () => void
}

export function ClientForm({ products, client, onSuccess }: ClientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    company: client?.company || "",
    cuit: client?.cuit || "",
    location: client?.location || "",
    contact_name: client?.contact_name || "",
    contact_phone: client?.contact_phone || "",
    contact_email: client?.contact_email || "",
    commercial_contact_name: client?.commercial_contact_name || "",
    commercial_contact_phone: client?.commercial_contact_phone || "",
    logistics_contact_name: client?.logistics_contact_name || "",
    logistics_contact_phone: client?.logistics_contact_phone || "",
    address: client?.address || "",
    sale_condition: client?.sale_condition || "",
    document_type: client?.document_type || "CUIT",
    taxpayer_type: client?.taxpayer_type || "",
    responsibles: client?.responsibles || "",
    comments: client?.comments || "",
    selectedProducts: client?.client_products?.map((cp) => cp.product_id) || ([] as string[]),
  })

  const handleProductToggle = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter((id) => id !== productId)
        : [...prev.selectedProducts, productId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const clientData = {
        company: formData.company,
        cuit: formData.cuit || null,
        location: formData.location || null,
        contact_name: formData.contact_name || null,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
        commercial_contact_name: formData.commercial_contact_name || null,
        commercial_contact_phone: formData.commercial_contact_phone || null,
        logistics_contact_name: formData.logistics_contact_name || null,
        logistics_contact_phone: formData.logistics_contact_phone || null,
        address: formData.address || null,
        sale_condition: formData.sale_condition || null,
        document_type: formData.document_type || null,
        taxpayer_type: formData.taxpayer_type || null,
        responsibles: formData.responsibles || null,
        comments: formData.comments || null,
      }

      let clientId: string

      if (client) {
        const { error: updateError } = await supabase.from("clients").update(clientData).eq("id", client.id)

        if (updateError) throw updateError
        clientId = client.id

        await supabase.from("client_products").delete().eq("client_id", client.id)
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert([clientData])
          .select()
          .single()

        if (clientError) throw clientError
        clientId = newClient.id
      }

      if (formData.selectedProducts.length > 0) {
        const clientProductData = formData.selectedProducts.map((productId) => ({
          client_id: clientId,
          product_id: productId,
        }))

        const { error: relationError } = await supabase.from("client_products").insert(clientProductData)

        if (relationError) throw relationError
      }

      if (!client) {
        setFormData({
          company: "",
          cuit: "",
          location: "",
          contact_name: "",
          contact_phone: "",
          contact_email: "",
          commercial_contact_name: "",
          commercial_contact_phone: "",
          logistics_contact_name: "",
          logistics_contact_phone: "",
          address: "",
          sale_condition: "",
          document_type: "CUIT",
          taxpayer_type: "",
          responsibles: "",
          comments: "",
          selectedProducts: [],
        })
      }

      if (onSuccess) {
        onSuccess()
      }
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert(client ? "Error al actualizar cliente" : "Error al agregar cliente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company">Empresa</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          required
          placeholder="Nombre de la empresa"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cuit">CUIT (Opcional)</Label>
        <Input
          id="cuit"
          value={formData.cuit}
          onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
          placeholder="30-12345678-9"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Localidad (Opcional)</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Ciudad o localidad"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_name">Nombre Contacto</Label>
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
          type="tel"
          value={formData.contact_phone}
          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
          placeholder="+54 9 11 1234-5678"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_email">Email</Label>
        <Input
          id="contact_email"
          type="email"
          value={formData.contact_email}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          placeholder="contacto@empresa.com"
        />
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Contacto Comercial (Opcional)</h3>

        <div className="space-y-2">
          <Label htmlFor="commercial_contact_name">Nombre Comercial</Label>
          <Input
            id="commercial_contact_name"
            value={formData.commercial_contact_name}
            onChange={(e) => setFormData({ ...formData, commercial_contact_name: e.target.value })}
            placeholder="Nombre del contacto comercial"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="commercial_contact_phone">Teléfono Comercial</Label>
          <Input
            id="commercial_contact_phone"
            type="tel"
            value={formData.commercial_contact_phone}
            onChange={(e) => setFormData({ ...formData, commercial_contact_phone: e.target.value })}
            placeholder="+54 9 11 1234-5678"
          />
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Contacto Logístico (Opcional)</h3>

        <div className="space-y-2">
          <Label htmlFor="logistics_contact_name">Nombre Logístico</Label>
          <Input
            id="logistics_contact_name"
            value={formData.logistics_contact_name}
            onChange={(e) => setFormData({ ...formData, logistics_contact_name: e.target.value })}
            placeholder="Nombre del contacto logístico"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logistics_contact_phone">Teléfono Logístico</Label>
          <Input
            id="logistics_contact_phone"
            type="tel"
            value={formData.logistics_contact_phone}
            onChange={(e) => setFormData({ ...formData, logistics_contact_phone: e.target.value })}
            placeholder="+54 9 11 1234-5678"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Productos que Transporta</Label>
        <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay productos disponibles</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="flex items-center space-x-2">
                <Checkbox
                  id={product.id}
                  checked={formData.selectedProducts.includes(product.id)}
                  onCheckedChange={() => handleProductToggle(product.id)}
                />
                <Label htmlFor={product.id} className="text-sm font-normal cursor-pointer">
                  {product.name}
                </Label>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección (Opcional)</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={2}
          placeholder="Dirección completa"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sale_condition">Condición de Venta (Opcional)</Label>
        <Input
          id="sale_condition"
          value={formData.sale_condition}
          onChange={(e) => setFormData({ ...formData, sale_condition: e.target.value })}
          placeholder="Ej: Contado, 30 días, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="document_type">Tipo de Documento</Label>
        <Input
          id="document_type"
          value={formData.document_type}
          onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
          placeholder="CUIT, DNI, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="taxpayer_type">Tipo Responsable (Opcional)</Label>
        <Input
          id="taxpayer_type"
          value={formData.taxpayer_type}
          onChange={(e) => setFormData({ ...formData, taxpayer_type: e.target.value })}
          placeholder="RI, Monotributista, Exento, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsibles">Responsables (Opcional)</Label>
        <Textarea
          id="responsibles"
          value={formData.responsibles}
          onChange={(e) => setFormData({ ...formData, responsibles: e.target.value })}
          rows={2}
          placeholder="Nombres de responsables..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments">Comentarios (Opcional)</Label>
        <Textarea
          id="comments"
          value={formData.comments}
          onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          rows={3}
          placeholder="Comentarios adicionales..."
        />
      </div>

      <Button type="submit" className="w-full bg-[#0038ae] hover:bg-[#0038ae]/90" disabled={loading}>
        {loading ? (client ? "Actualizando..." : "Agregando...") : client ? "Actualizar Cliente" : "Agregar Cliente"}
      </Button>
    </form>
  )
}
