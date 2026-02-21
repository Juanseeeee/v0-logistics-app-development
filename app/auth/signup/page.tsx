"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"owner" | "manager">("manager")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/hub`,
          data: {
            role,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cuenta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0038ae]/10 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-[#0038ae] flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Cronos Logística</CardTitle>
          <CardDescription>
            {success ? "Cuenta creada exitosamente! Verifica tu email." : "Sistema de Acceso Restringido"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 font-medium">Cuenta creada exitosamente! Verifica tu email.</div>
              <div className="text-sm text-muted-foreground">Redirigiendo al login...</div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h3 className="font-semibold text-amber-900">Registro Desactivado</h3>
                <p className="text-sm text-amber-800">
                  Este sistema es privado y confidencial. El acceso es solo por invitación.
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Si necesitas acceso, contacta al administrador del sistema para que te cree una cuenta.
                </p>
              </div>
            </div>
          )}
          <Button
            type="button"
            className="w-full bg-[#0038ae] hover:bg-[#0038ae]/90"
            onClick={() => router.push("/auth/login")}
          >
            {success ? "Volver al Login" : "Ya tengo cuenta"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
