# Cronos Logística - Sistema de Gestión Integral

Sistema moderno y completo de gestión logística diseñado para empresas de transporte. Desarrollado con Next.js 16, React 19, TypeScript y Supabase.

## Características Principales

### Gestión de Flota
- Administración completa de vehículos (chasis y semis)
- Control de mantenimientos programados con sistema de alertas
- Registro de combustible, kilometraje y gastos operativos
- Dashboard con estadísticas en tiempo real
- Gestión de documentación vehicular

### Gestión Logística
- Asignación y seguimiento de viajes en tiempo real
- Gestión de choferes y disponibilidad
- Mapa interactivo con ubicaciones actualizadas
- Sistema de viajes propios y tercerizados
- Reportes y estadísticas detalladas

### Gestión Financiera
- Órdenes de compra con generación automática de PDF profesional
- Gestión completa de proveedores con CRUD
- Control de gastos categorizado (mantenimiento, combustible, seguros, etc.)
- Filtros avanzados y búsqueda rápida
- Dashboard financiero con métricas clave

### Gestión de Documentación
- Almacenamiento seguro de documentos empresariales
- Seguimiento de vencimientos con sistema de alertas
- Documentación de vehículos, choferes y empresas
- Categorización y búsqueda avanzada
- Integración con Vercel Blob Storage

### Sistema de Usuarios y Roles
- Autenticación segura con Supabase Auth
- Sistema de roles granular (admin, owner, manager, driver, etc.)
- Permisos por módulo
- Interfaz personalizada según rol

## Tecnologías Utilizadas

### Frontend
- **Next.js 16** - Framework React con App Router
- **React 19** - Librería UI con Server Components
- **TypeScript** - Tipado estático
- **Tailwind CSS v4** - Framework CSS moderno
- **shadcn/ui** - Componentes UI accesibles
- **Lucide Icons** - Iconografía moderna

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Real-time subscriptions
- **Vercel Blob** - Almacenamiento de archivos
- **jsPDF** - Generación de PDFs

### Características Técnicas
- Dark/Light mode con persistencia
- Diseño responsive mobile-first
- Animaciones y transiciones suaves
- Optimización de performance
- SEO optimizado
- TypeScript estricto

## Estructura del Proyecto

```
cronos-logistica/
├── app/                    # Rutas de la aplicación
│   ├── auth/              # Autenticación
│   ├── fleet/             # Módulo de Flota
│   ├── logistics/         # Módulo Logístico
│   ├── finance/           # Módulo Financiero
│   ├── documents/         # Módulo de Documentación
│   ├── admin/             # Panel de administración
│   └── hub/               # Dashboard principal
├── components/            # Componentes React reutilizables
│   ├── ui/               # Componentes base de shadcn/ui
│   └── ...               # Componentes específicos
├── lib/                   # Utilidades y configuración
│   ├── supabase/         # Cliente Supabase
│   ├── auth/             # Sistema de roles
│   └── pdf/              # Generación de PDFs
└── scripts/              # Migraciones SQL

```

## Módulos del Sistema

### 1. Fleet Management (Gestión de Flota)
Control completo de vehículos propios con mantenimientos, combustible y alertas.

### 2. Logistics Management (Gestión Logística)
Asignación de viajes, seguimiento en tiempo real y gestión de choferes.

### 3. Finance Management (Gestión Financiera)
Órdenes de compra, proveedores y control de gastos empresariales.

### 4. Document Management (Gestión de Documentación)
Almacenamiento y control de vencimientos de documentación crítica.

### 5. User Administration (Administración de Usuarios)
Gestión de usuarios, roles y permisos del sistema.

## Características de Diseño

### UI/UX Moderno
- Diseño limpio y profesional
- Navegación intuitiva
- Feedback visual inmediato
- Animaciones sutiles

### Accesibilidad
- ARIA labels completos
- Navegación por teclado
- Alto contraste
- Screen reader friendly

### Performance
- Server Components para mejor rendimiento
- Lazy loading de imágenes
- Code splitting automático
- Caché optimizado

## Instalación y Configuración

```bash
# Clonar repositorio
git clone https://github.com/tuusuario/cronos-logistica.git

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env.local con:
# NEXT_PUBLIC_SUPABASE_URL=tu_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
# BLOB_READ_WRITE_TOKEN=tu_token

# Ejecutar migraciones de base de datos
# (Los scripts SQL están en /scripts)

# Iniciar servidor de desarrollo
npm run dev
```

## Base de Datos

El sistema utiliza PostgreSQL a través de Supabase con las siguientes tablas principales:

- `users` - Usuarios del sistema
- `vehicles` - Vehículos de la flota
- `trips` - Viajes y asignaciones
- `purchase_orders` - Órdenes de compra
- `suppliers` - Proveedores
- `expenses` - Gastos
- `documents` - Documentación
- Y más...

Todas las tablas incluyen Row Level Security (RLS) para seguridad a nivel de base de datos.

## Seguridad

- Autenticación JWT con Supabase
- Row Level Security en todas las tablas
- Validación de permisos por rol
- Sanitización de inputs
- HTTPS obligatorio
- Tokens seguros

## Deployment

El sistema está optimizado para deployment en Vercel:

```bash
# Deploy a producción
vercel --prod
```

## Contribución

Este es un proyecto de portafolio. Si deseas usarlo como base para tu propio proyecto, siéntete libre de hacer fork del repositorio.

## Licencia

MIT License - Ver archivo LICENSE para más detalles

## Contacto

Desarrollado por [Tu Nombre]
- Portfolio: [tu-portfolio.com]
- LinkedIn: [tu-linkedin]
- Email: [tu-email]

---

**Nota:** Este es un sistema completo de gestión empresarial diseñado para demostrar habilidades en desarrollo full-stack moderno con React, Next.js, TypeScript y Supabase.
