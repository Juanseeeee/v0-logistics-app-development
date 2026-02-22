"use client"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, UserPlus, Mail, Pencil } from "lucide-react"
import { ROLES, ROLE_DESCRIPTIONS, type Role } from "@/lib/auth/roles"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  role: string
  name?: string
  created_at: string
}

export function UserManagement({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState<Role>(ROLES.REPORTER)
  const [newUserName, setNewUserName] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserRole) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          name: newUserName || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al crear usuario")
      }

      const newUser = {
        id: result.userId,
        email: newUserEmail,
        role: newUserRole,
        name: newUserName || undefined,
        created_at: new Date().toISOString(),
      }

      setNewUserEmail("")
      setNewUserPassword("")
      setNewUserRole(ROLES.REPORTER)
      setNewUserName("")
      setIsCreating(false)

      setUsers([newUser, ...users])

      alert(
        "Usuario creado exitosamente. El usuario puede iniciar sesión inmediatamente con las credenciales proporcionadas.",
      )
    } catch (error: any) {
      console.error("Error creating user:", error)
      alert(`Error al crear usuario: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser({ ...user })
    setIsEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingUser(null)
  }

  const handleEditUser = async () => {
    if (!editingUser) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: editingUser.name || null,
          role: editingUser.role,
        })
        .eq("id", editingUser.id)

      if (error) throw error

      setUsers(users.map((u) => (u.id === editingUser.id ? editingUser : u)))
      alert("Usuario actualizado exitosamente")
      closeEditDialog()
      router.refresh()
    } catch (error: any) {
      console.error("Error updating user:", error)
      alert(`Error al actualizar usuario: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return

    setLoading(true)
    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al eliminar usuario")
      }

      setUsers(users.filter((u) => u.id !== userId))
      alert("Usuario eliminado exitosamente")
      router.refresh()
    } catch (error: any) {
      console.error("Error deleting user:", error)
      alert(`Error al eliminar usuario: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case ROLES.ADMIN:
        return "bg-red-500"
      case ROLES.OWNER:
        return "bg-purple-500"
      case ROLES.MANAGER:
        return "bg-blue-500"
      case ROLES.TRIP_MANAGER:
        return "bg-green-500"
      case ROLES.REPORTER:
        return "bg-yellow-500"
      case ROLES.DOCUMENTS:
        return "bg-orange-500"
      case ROLES.FLEET_DOCS:
        return "bg-teal-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <Button onClick={() => setIsCreating(!isCreating)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          {isCreating ? "Cancelar" : "Nuevo Usuario"}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre (Opcional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as Role)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => (
                    <SelectItem key={role} value={role}>
                      {description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateUser} disabled={loading} className="w-full">
              {loading ? "Creando..." : "Crear Usuario"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name || <span className="text-muted-foreground">Sin nombre</span>}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {ROLE_DESCRIPTIONS[user.role as Role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString("es-AR")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={editingUser?.name || ""}
                onChange={(e) => setEditingUser(editingUser ? { ...editingUser, name: e.target.value } : null)}
                placeholder="Nombre del usuario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" value={editingUser?.email || ""} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground">El email no se puede modificar</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol</Label>
              <Select
                value={editingUser?.role}
                onValueChange={(value) => setEditingUser(editingUser ? { ...editingUser, role: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => (
                    <SelectItem key={role} value={role}>
                      {description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleEditUser} disabled={loading} className="w-full">
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
