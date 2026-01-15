# Proyecto RRHH (Vite + React + Supabase)

Aplicacion web para gestion de empleados y novedades (vacaciones, licencias, cambios de turno y sanciones), con acceso por roles y flujo de invitaciones por email.

## Requisitos

- Node.js + npm
- Variables de entorno en `.env`

Ejemplo de `.env`:

```
VITE_APP_SUPABASE_URL=...
VITE_APP_SUPABASE_ANON_KEY=...
```

## Scripts

- `npm install`
- `npm run dev` (desarrollo)
- `npm run build` (build prod)
- `npm run preview` (preview prod)
- `npm run lint`
- `npm run generate:cambio-template` (genera `public/templates/cambio_template.docx`)

## Stack y arquitectura

- React + Vite
- React Router (`src/routers/routes.jsx`)
- React Query para fetch/cache
- Zustand para stores
- Supabase para auth, DB y storage

## Autenticacion y permisos

- El login usa Supabase Auth con email/password.
- `initializeAuth` valida:
  - Existe perfil en `perfiles` para el `auth_user_id`.
  - Si el rol es `employee`, el empleado asociado debe estar activo.
  - Si falla, se fuerza `signOut`.
- Los permisos frontend se definen en `src/utils/permissions.js` y se consultan con `usePermissions`.

Roles definidos en el frontend:

- `superadmin`
- `rrhh`
- `employee`

Notas importantes:

- En el flujo de invitaciones aparece `admin` como rol posible; no esta definido en `utils/permissions.js` (el backend puede manejarlo, pero el frontend no lo mapea como permisos).
- Las rutas se protegen solo por autenticacion (`ProtectedRoute`). La restriccion por rol se aplica en botones/acciones, no en rutas completas. Para seguridad real, usar RLS en Supabase.

Resumen de permisos (frontend):

- `superadmin`: CRUD completo en todos los recursos, incluida `configuracion`.
- `rrhh`: CRUD completo en `empleados`, `vacaciones`, `licencias`, `cambios`, `sanciones`, `categorias`, `sucursales`. En `configuracion` solo lectura.
- `employee`: solo lectura en recursos principales; sin acceso a `configuracion`.

## Acceso web con permisos RRHH

1. El usuario debe existir en Supabase Auth.
2. Debe existir un registro en `perfiles` con `app_role = rrhh`.
3. Iniciar sesion en `/login`.
4. Al autenticar, la app carga el perfil y habilita acciones RRHH (crear/editar/eliminar).

Si aparece "Perfil no encontrado", falta el registro en `perfiles`.

## Invitaciones de empleados (RRHH)

### Donde se accede

- Menu: **Configuracion** -> **Invitar empleado**
- Ruta directa: `/configuracion/invitaciones`
- Desde el detalle de un empleado (`/empleados/:id`), boton **Crear usuario**.

### Quien puede invitar

Solo `rrhh`, `admin` o `superadmin` (ver `InvitacionesSection`).

### Flujo

1. Se resuelve `empresa_id` con el RPC `mostrar_empresa_por_auth_user_public`.
2. En el modal se completa:
   - Email
   - Rol (employee / rrhh / admin)
   - Empleado (opcional). Lista solo empleados activos sin usuario (`user_id` en null).
3. Se invoca la funcion edge `invite_user`.
4. Se crea un registro en `user_invitations`.
5. El invitado recibe email y define contraseña en `/set-password`.
6. Luego de guardar contraseña, se invoca `accept_invitation`.

Estados visibles en la tabla de invitaciones:

- `pending`, `accepted`, `linked`, `expired`

Notas:

- Si se invito desde el perfil de un empleado, el empleado queda fijo en el modal.
- Si `empresa_id` no esta disponible, el boton queda deshabilitado.

## Funcionalidades principales

### Home

Accesos rapidos a Empleados, Reportes y Perfil.

### Empleados

- Listado con buscador y filtro por sucursal.
- Crear/editar empleados (solo roles con permiso `empleados`).
- Datos base: nombre, documento, legajo, area, puesto, sucursal, estado, etc.
- Deteccion de duplicados (documento y legajo).

### Detalle de empleado

Incluye secciones:

- Vacaciones
- Licencias (con certificado opcional)
- Cambios de turno/actividades
- Sanciones

Acciones por permiso:

- Crear/editar/eliminar segun `usePermissions`.
- Exportacion a Word:
  - Cambios: `public/templates/cambio_template.docx`
  - Sanciones: `public/templates/sancion_template.docx`

### Reportes

Tabs por modulo (vacaciones, licencias, cambios, sanciones) con filtros de fecha y empleado.

### Perfil

Datos del usuario, cambio de contraseña y listado de novedades personales si tiene empleado asociado.

### Configuracion

Acceso a invitaciones y cierre de sesion.

## Integracion Supabase

Tablas consultadas (segun queries del frontend):

- `perfiles`
- `empleados`
- `user_invitations`
- `empleados_vacaciones`
- `empleados_licencias`
- `licencias_categorias`
- `licencias_tipos`
- `empleados_cambios_actividades`
- `empleados_sanciones`
- `empleados_documentos`
- `sucursales`
- `sucursales_empleados`
- `areas_laborales`
- `puestos_laborales`
- `empresas` (relaciones en reportes/cambios/sanciones)

Funciones edge / RPC requeridas:

- `invite_user` (enviar invitaciones)
- `accept_invitation` (confirmar invitacion)
- `mostrar_empresa_por_auth_user_public` (resolver empresa por auth user)

Storage:

- Bucket `documents` para certificados de licencias
  - Tipos permitidos: PDF, JPG, PNG, WEBP
  - Max: 5 MB

## Rutas principales

- `/login`
- `/register` (registro basico en Supabase Auth)
- `/set-password` (seteo de contraseña y accept_invitation)
- `/` (home)
- `/empleados`
- `/empleados/nuevo`
- `/empleados/:id`
- `/reportes`
- `/perfil`
- `/configuracion`
- `/configuracion/invitaciones`

## Troubleshooting rapido

- "Perfil no encontrado": falta registro en `perfiles` para el `auth_user_id`.
- "Empleado no activo": el rol es `employee` y su empleado esta inactivo.
- "No se encontro la empresa activa": el RPC no retorna empresa para el usuario.
