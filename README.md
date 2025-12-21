# 🚀 Proyecto - Sistema de Autenticación

Sistema web completo con autenticación propia basada en email y contraseña, desarrollado con React, Supabase y gestión de estado con Zustand.

---

## 📑 Índice de Documentación

### 🎯 Inicio Rápido
**[INICIO_RAPIDO.md](INICIO_RAPIDO.md)** - Para empezar en 3 minutos
- Configuración básica
- Primeros pasos
- Prueba del sistema

### 📘 Documentación Completa
**[AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md)** - Guía detallada
- Arquitectura completa
- Características implementadas
- Ejemplos de uso
- Troubleshooting completo
- Configuración avanzada

### 📊 Arquitectura
**[ARQUITECTURA.md](ARQUITECTURA.md)** - Diagramas y flujos
- Diagrama de capas
- Flujo de registro
- Flujo de login
- Estructura de carpetas
- Conceptos clave

### 📋 Resumen Ejecutivo
**[RESUMEN_AUTHENTICATION.md](RESUMEN_AUTHENTICATION.md)** - Vista general
- Archivos creados/modificados
- Características
- Pasos de activación
- Ejemplos de código

### ✅ Checklist
**[CHECKLIST.md](CHECKLIST.md)** - Verificación paso a paso
- Configuración inicial
- Pruebas funcionales
- Verificaciones de consola
- Lista de problemas comunes

---

## 🎯 Stack Tecnológico

- **Frontend:** React 19 + Vite
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth (email/contraseña)
- **Estado:** Zustand
- **Estilos:** Styled Components
- **Routing:** React Router DOM v7
- **Alertas:** SweetAlert2
- **Forms:** React Hook Form
- **HTTP Client:** Supabase JS

---

## 🔐 Características de Autenticación

✅ Registro de usuarios con email y contraseña
✅ Inicio de sesión con validación
✅ Contraseñas hasheadas (bcrypt automático)
✅ Persistencia de sesión
✅ Protección de rutas
✅ Sincronización automática de usuarios (trigger SQL)
✅ Manejo de errores específico
✅ Validaciones frontend completas
✅ Estados de carga

---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Crear archivo `.env` en la raíz:
```env
VITE_APP_SUPABASE_URL=tu-url-de-supabase
VITE_APP_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Ejecutar Script SQL
1. Abrir [Supabase Dashboard](https://app.supabase.com)
2. SQL Editor → Pegar contenido de `database/sync_auth_users.sql`
3. Ejecutar (Run)

### 4. Iniciar Servidor de Desarrollo
```bash
npm run dev
```

### 5. Crear Primer Usuario
Navegar a: `http://localhost:5173/register`

**Ver más detalles en [INICIO_RAPIDO.md](INICIO_RAPIDO.md)**

---

## 📁 Estructura del Proyecto

```
proyecto/
├── src/
│   ├── components/
│   │   ├── templates/
│   │   │   ├── LoginTemplate.jsx
│   │   │   └── RegisterTemplate.jsx
│   │   └── ...
│   ├── pages/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── store/
│   │   └── AuthStore.jsx
│   ├── routers/
│   │   └── routes.jsx
│   ├── supabase/
│   │   └── supabase.config.jsx
│   └── ...
├── database/
│   ├── sync_auth_users.sql
│   └── additional_sql_scripts.sql
├── examples/
│   └── authentication_examples.js.example
├── AUTHENTICATION_GUIDE.md
├── INICIO_RAPIDO.md
├── ARQUITECTURA.md
├── RESUMEN_AUTHENTICATION.md
└── CHECKLIST.md
```

---

## 🎨 Rutas Disponibles

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/register` | Registro de usuarios | Público |
| `/login` | Inicio de sesión | Público |
| `/` o `/home` | Dashboard principal | Protegido |
| `/configuracion` | Configuración | Protegido |
| `/configuracion/categorias` | Gestión de categorías | Protegido |

---

## 💻 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo (Vite)

# Producción
npm run build        # Construye para producción
npm run preview      # Preview del build de producción

# Linting
npm run lint         # Ejecuta ESLint
```

---

## 📚 Ejemplos de Código

### Registrar Usuario
```javascript
import { useAuthStore } from './store/AuthStore';

const { registerUser } = useAuthStore();

await registerUser('usuario@ejemplo.com', 'password123', 'Juan Pérez');
```

### Iniciar Sesión
```javascript
const { loginEmailPassword } = useAuthStore();

await loginEmailPassword('usuario@ejemplo.com', 'password123');
```

### Cerrar Sesión
```javascript
const { cerrarSesion } = useAuthStore();

await cerrarSesion();
```

**Ver más ejemplos en [examples/authentication_examples.js.example](examples/authentication_examples.js.example)**

---

## 🔧 Configuración de Supabase

### Dashboard → Authentication → Settings
```yaml
Email Auth: Enabled ✅
Confirm Email: Habilitado (prod) o Deshabilitado (dev)
Google Auth: Disabled ❌ (opcional)
```

### Políticas de Seguridad (RLS)
Ver `database/additional_sql_scripts.sql` sección 6

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Email not confirmed" | Deshabilitar en Settings o confirmar manualmente con SQL |
| Usuario no sincroniza | Verificar trigger en SQL Editor |
| Session no persiste | Verificar AppWrapper en main.jsx |

**Ver más en [AUTHENTICATION_GUIDE.md - Sección Troubleshooting](AUTHENTICATION_GUIDE.md#-troubleshooting)**

---

## 📊 Base de Datos

### Tablas Principales
- **`auth.users`** - Autenticación (Supabase)
- **`public.users`** - Datos de negocio
- **Sincronización:** Trigger automático

### Scripts SQL
- `database/sync_auth_users.sql` - Trigger de sincronización
- `database/additional_sql_scripts.sql` - Utilidades y consultas

---

## 🔒 Seguridad

✅ Contraseñas hasheadas con bcrypt
✅ JWT para sesiones
✅ Validaciones frontend y backend
✅ Row Level Security (RLS) configurable
✅ HTTPS en producción (Supabase)
✅ Tokens con expiración

---

## 🚀 Deployment

### Variables de Entorno en Hosting
```env
VITE_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_APP_SUPABASE_ANON_KEY=tu-anon-key
```

### Build
```bash
npm run build
# Los archivos generados estarán en dist/
```

### Hosting Recomendados
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages (con ajustes)

---

## 📄 Licencia

Este proyecto es privado y de uso interno.

---

## 👥 Contribución

Sistema implementado con las siguientes características:
- ✅ Sin dependencias de OAuth externas
- ✅ Respeto a estructura de DB existente
- ✅ Documentación completa
- ✅ Código limpio y mantenible

---

## 📞 Soporte

Para preguntas o problemas:
1. Revisar [CHECKLIST.md](CHECKLIST.md)
2. Consultar [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md)
3. Verificar logs en consola del navegador
4. Revisar Supabase Dashboard

---

## 🎯 Estado del Proyecto

**✅ Sistema de Autenticación: Completado**
- Registro de usuarios
- Inicio de sesión
- Protección de rutas
- Persistencia de sesión
- Sincronización de datos

---

## 📖 Recursos Adicionales

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [React Router DOM](https://reactrouter.com)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [Vite Guide](https://vitejs.dev/guide/)

---

**🎉 Proyecto listo para desarrollo y producción**
