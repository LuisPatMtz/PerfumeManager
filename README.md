# Perfumes Manager

> **Sistema ERP para negocios de decants de perfume**
> **ERP system for perfume decant businesses**

---

## ¿Qué es esto? / What is this?

**ES** — Perfumes Manager es un ERP completo diseñado para emprendedores que venden decants (fracciones) de perfumes de lujo. El negocio consiste en comprar botellas completas de perfumes originales y venderlas en pequeñas dosis (5ml, 10ml, 30ml, etc.) a un precio accesible, permitiendo que más personas disfruten fragancias de lujo sin pagar el precio de la botella completa.

Este sistema centraliza todo lo que necesitas para operar el negocio de forma profesional: desde el control de inventario de botellas hasta el análisis de rentabilidad por perfume, pasando por la gestión de créditos de clientes, el flujo de caja y las metas de reinversión.

**EN** — Perfumes Manager is a full-stack ERP built for entrepreneurs who sell perfume decants (fractions). The business model consists of buying full bottles of luxury fragrances and reselling them in small doses (5ml, 10ml, 30ml, etc.) at accessible prices, making luxury perfumes available to more people without the cost of a full bottle.

This system centralizes everything needed to run the business professionally: from bottle inventory tracking to per-perfume profitability analysis, customer credit management, cash flow control, and reinvestment goal planning.

---

## Stack tecnológico

| Capa | Tecnologías |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4, TanStack Query, Recharts, Lucide |
| Backend | Express, TypeScript, Prisma ORM, Zod |
| Base de datos | PostgreSQL |
| Autenticación | JWT (cookies HTTP-only) |

## Módulos

- **Dashboard** — KPIs del negocio, gráfica de ventas de los últimos 7 días, perfumes más vendidos, resumen financiero e insights automáticos
- **Perfumes** — Catálogo con concentración, precios por ml y estado de inventario
- **Botellas** — Inventario por botella con ml calculados y ml reales
- **Ventas** — Ventas con múltiples artículos, métodos de pago (efectivo, transferencia, tarjeta, crédito)
- **Créditos** — Saldos pendientes, historial de pagos y clasificación de riesgo por cliente
- **Clientes** — Perfiles de clientes con bandera VIP
- **Caja** — Libro de flujo de efectivo completo: gastos, aportaciones del dueño, retiros
- **Rentabilidad** — ROI y margen por perfume, detección de inventario estancado
- **Insumos** — Inventario de empaque (frasquitos, bolsas, stickers, etc.) con alertas de stock mínimo
- **Movimientos** — Bitácora de ml por perfume (ventas, regalos, muestras, pérdidas, ajustes)
- **Alertas** — Alertas automáticas por stock bajo, créditos vencidos, inventario muerto y metas completadas
- **Metas** — Seguimiento de metas de reinversión con progreso y fecha objetivo
- **Snapshots** — Fotografías financieras periódicas (caja, utilidad, valor de inventario, ROI promedio)

## Requisitos

- Node.js 20+
- PostgreSQL 15+
- npm

## Instalación

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/<tu-usuario>/perfumes-manager.git
cd perfumes-manager

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configurar variables de entorno

**Backend** — copia y llena `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/perfume_manager"
JWT_SECRET="cambia-esto-por-una-cadena-segura"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

**Frontend** — copia y llena `frontend/.env.local`:

```bash
cp frontend/.env.local.example frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Configurar la base de datos

```bash
cd backend

# Ejecutar migraciones
npx prisma migrate dev
```

### 4. Iniciar la aplicación

Abre dos terminales:

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend && npm run dev

# Terminal 2 — frontend (http://localhost:3000)
cd frontend && npm run dev
```

## Estructura del proyecto

```
perfumes-manager/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # 24 modelos, PostgreSQL
│   └── src/
│       ├── middleware/          # Autenticación, manejo de errores
│       ├── routes/              # 14 routers de Express
│       ├── services/            # Capa de lógica de negocio
│       └── index.ts             # Punto de entrada del servidor
└── frontend/
    └── src/
        ├── app/
        │   ├── (auth)/          # Página de login
        │   └── (dashboard)/     # 13 páginas protegidas
        ├── components/          # Componentes UI reutilizables
        └── hooks/               # Hooks de TanStack Query por dominio
```

## API

El backend expone una API REST bajo `/api`. Todas las rutas requieren cookie JWT válida excepto `POST /api/auth/login`.

| Prefijo | Descripción |
|---|---|
| `/api/auth` | Login / logout / sesión actual |
| `/api/perfumes` | Catálogo de perfumes |
| `/api/bottles` | Inventario de botellas |
| `/api/sales` | Ventas y artículos de venta |
| `/api/credits` | Gestión de créditos |
| `/api/customers` | Perfiles de clientes |
| `/api/supplies` | Insumos de empaque |
| `/api/perfume-movements` | Bitácora de ml |
| `/api/cash` | Flujo de caja (gastos, aportaciones, retiros) |
| `/api/profitability` | Análisis de ROI y margen |
| `/api/dashboard` | KPIs e insights |
| `/api/alerts` | Alertas del sistema |
| `/api/snapshots` | Snapshots financieros |
| `/api/goals` | Metas de reinversión |

## Licencia

MIT
