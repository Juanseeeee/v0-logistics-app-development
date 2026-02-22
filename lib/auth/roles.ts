export const ROLES = {
  ADMIN: "admin",
  OWNER: "owner",
  MANAGER: "manager",
  TRIP_MANAGER: "trip_manager",
  REPORTER: "reporter",
  DOCUMENTS: "documents",
  FLEET_DOCS: "fleet_docs",
  DRIVER: "driver",
  COMPANY: "company",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: "Administrador - Acceso total al sistema",
  [ROLES.OWNER]: "Propietario - Acceso completo a gestión",
  [ROLES.MANAGER]: "Manager - Gestión de flota y logística",
  [ROLES.TRIP_MANAGER]: "Encargado de Viajes - Solo módulo de logística",
  [ROLES.REPORTER]: "Gestor/a - Solo descarga/subida de reportes",
  [ROLES.DOCUMENTS]: "Documentación - Gestión de documentos",
  [ROLES.FLEET_DOCS]: "Flota y Documentación - Gestión de flota y documentos",
  [ROLES.DRIVER]: "Chofer - Acceso limitado",
  [ROLES.COMPANY]: "Empresa - Acceso limitado",
}

// Permisos de acceso a módulos
export const PERMISSIONS = {
  // Gestión de Flota
  FLEET_VIEW: [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.REPORTER, ROLES.FLEET_DOCS],
  FLEET_EDIT: [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.FLEET_DOCS],

  // Gestión Logística
  LOGISTICS_VIEW: [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.TRIP_MANAGER, ROLES.REPORTER],
  LOGISTICS_EDIT: [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.TRIP_MANAGER],

  // Reportes
  REPORTS_VIEW: [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.REPORTER, ROLES.FLEET_DOCS],
  REPORTS_DOWNLOAD: [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.REPORTER, ROLES.FLEET_DOCS],
  REPORTS_UPLOAD: [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.REPORTER, ROLES.FLEET_DOCS],

  // Administración
  ADMIN_PANEL: [ROLES.ADMIN],
  USER_MANAGEMENT: [ROLES.ADMIN],
  DATA_IMPORT: [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER],

  // Documentos
  DOCUMENTS_FULL: [ROLES.ADMIN, ROLES.DOCUMENTS, ROLES.FLEET_DOCS],

  // Finanzas
  FINANCE_VIEW: [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER],
  FINANCE_EDIT: [ROLES.ADMIN, ROLES.OWNER],
}

export function hasPermission(userRole: string | null, permission: keyof typeof PERMISSIONS): boolean {
  if (!userRole) return false
  return PERMISSIONS[permission].includes(userRole as Role)
}

export function canAccessFleet(userRole: string | null): boolean {
  return hasPermission(userRole, "FLEET_VIEW")
}

export function canEditFleet(userRole: string | null): boolean {
  return hasPermission(userRole, "FLEET_EDIT")
}

export function canAccessLogistics(userRole: string | null): boolean {
  return hasPermission(userRole, "LOGISTICS_VIEW")
}

export function canEditLogistics(userRole: string | null): boolean {
  return hasPermission(userRole, "LOGISTICS_EDIT")
}

export function canAccessReports(userRole: string | null): boolean {
  return hasPermission(userRole, "REPORTS_VIEW")
}

export function canManageUsers(userRole: string | null): boolean {
  return hasPermission(userRole, "USER_MANAGEMENT")
}

export function canAccessFinance(userRole: string | null): boolean {
  return hasPermission(userRole, "FINANCE_VIEW")
}

export function canEditFinance(userRole: string | null): boolean {
  return hasPermission(userRole, "FINANCE_EDIT")
}
