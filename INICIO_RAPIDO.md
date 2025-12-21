# 🚀 Inicio Rápido - Sistema de Autenticación

## ⚡ 3 Pasos para Activar el Sistema

### 1️⃣ Ejecutar Script SQL (1 minuto)

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor** (menú lateral izquierdo)
3. Copia todo el contenido de: [`database/sync_auth_users.sql`](database/sync_auth_users.sql)
4. Pégalo en el editor y haz clic en **Run** ▶️

**Esto crea el trigger que sincroniza automáticamente los usuarios.**

---

### 2️⃣ Configurar Supabase Auth (30 segundos)

1. En Supabase Dashboard, ve a **Authentication** → **Providers**
2. Busca **Email** y asegúrate que esté **Enabled** ✅
3. (Opcional) Para desarrollo: deshabilita **Confirm email** en Settings

**Captura de referencia:**
```
✅ Email Auth: Enabled
⚙️ Confirm email: Disabled (solo para desarrollo)
❌ Google: Disabled
```

---

### 3️⃣ Verificar Variables de Entorno

Asegúrate que tu archivo `.env` tenga:

```env
VITE_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_APP_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

**¿Dónde encontrar estas claves?**
- Supabase Dashboard → **Settings** → **API**
- Copia `Project URL` y `anon/public key`

---

## ✅ Probar el Sistema

### Opción A: Crear Usuario por Primera Vez

```bash
# 1. Inicia el servidor de desarrollo
npm run dev

# 2. Abre el navegador en:
http://localhost:5173/register

# 3. Completa el formulario:
   - Nombre: Tu Nombre
   - Email: tu@email.com
   - Contraseña: (mínimo 6 caracteres)
   - Confirmar contraseña

# 4. Haz clic en "REGISTRAR"
```

### Opción B: Iniciar Sesión

```bash
# Si ya tienes un usuario creado:
http://localhost:5173/login

# Ingresa email y contraseña
```

---

## 🎯 Flujo Completo

```
1. Usuario visita /register
   ↓
2. Completa formulario
   ↓
3. Click "REGISTRAR"
   ↓
4. Sistema hashea contraseña y crea usuario en auth.users
   ↓
5. Trigger automático crea registro en public.users
   ↓
6. Usuario recibe confirmación (si está habilitada)
   ↓
7. Redirección a /login
   ↓
8. Usuario ingresa credenciales
   ↓
9. Accede a /home
```

---

## 🐛 Troubleshooting Rápido

### Error: "Email not confirmed"

**Solución para desarrollo:**
```sql
-- Ejecutar en Supabase SQL Editor:
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'tu@email.com';
```

O deshabilita **Confirm email** en Settings.

---

### Error: Usuario no aparece en public.users

**Verificar trigger:**
```sql
-- Ejecutar en Supabase SQL Editor:
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

Si no aparece nada, vuelve a ejecutar [`database/sync_auth_users.sql`](database/sync_auth_users.sql).

---

### Error: Session no persiste

**Verificar que main.jsx tenga:**
```javascript
// src/main.jsx debe tener AppWrapper con useEffect
function AppWrapper() {
  const { initializeAuth } = useAuthStore();
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  return <App />;
}
```

✅ **Ya está implementado en tu proyecto.**

---

## 📖 Documentación Completa

Para más detalles, consulta:

- 📘 **[Guía Completa](AUTHENTICATION_GUIDE.md)** - Documentación detallada
- 📋 **[Resumen Ejecutivo](RESUMEN_AUTHENTICATION.md)** - Vista general
- 🔧 **[Scripts SQL](database/additional_sql_scripts.sql)** - Consultas útiles
- 💡 **[Ejemplos de Código](examples/authentication_examples.js.example)** - Snippets de código

---

## 🎨 Rutas Disponibles

| URL | Descripción |
|-----|-------------|
| `/register` | Crear nueva cuenta |
| `/login` | Iniciar sesión |
| `/home` | Dashboard (requiere login) |
| `/configuracion` | Configuración (requiere login) |

---

## 🔐 Características de Seguridad

✅ Contraseñas hasheadas con **bcrypt** (automático)
✅ Validaciones frontend y backend
✅ Manejo de errores específico
✅ Protección de rutas
✅ Persistencia de sesión

---

## 🚀 ¡Listo!

**Tu sistema de autenticación está configurado y listo para usar.**

Empieza creando tu primer usuario en:
👉 **http://localhost:5173/register**

---

¿Problemas? Revisa [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) sección Troubleshooting.
