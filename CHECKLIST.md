# ✅ Checklist de Implementación

Usa este checklist para verificar que todo esté configurado correctamente.

---

## 📋 Configuración Inicial

### Base de Datos
- [ ] Script `database/sync_auth_users.sql` ejecutado en Supabase SQL Editor
- [ ] Trigger `on_auth_user_created` creado correctamente
- [ ] Función `handle_new_user()` existe
- [ ] Tabla `public.users` tiene columna `id_auth`

**Verificación SQL:**
```sql
-- Ejecutar en SQL Editor:
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- Debe retornar 1 fila
```

---

### Variables de Entorno
- [ ] Archivo `.env` existe en la raíz del proyecto
- [ ] `VITE_APP_SUPABASE_URL` está configurada
- [ ] `VITE_APP_SUPABASE_ANON_KEY` está configurada
- [ ] Las URLs y keys son correctas (copia desde Supabase Dashboard)

**Verificación:**
```bash
# En terminal:
echo $env:VITE_APP_SUPABASE_URL    # PowerShell
# o
echo $VITE_APP_SUPABASE_URL        # Bash

# Debe mostrar tu URL de Supabase
```

---

### Supabase Dashboard
- [ ] Email Auth está **Enabled**
- [ ] Google Auth está **Disabled** (opcional, si quieres eliminarlo)
- [ ] Confirm email configurado según tu preferencia:
  - [ ] **Enabled** para producción (envía email de confirmación)
  - [ ] **Disabled** para desarrollo (acceso inmediato)

**Ubicación:** 
`Dashboard → Authentication → Providers → Email`

---

## 📁 Archivos del Proyecto

### Archivos Nuevos
- [ ] `src/components/templates/RegisterTemplate.jsx` existe
- [ ] `src/pages/Register.jsx` existe
- [ ] `database/sync_auth_users.sql` existe
- [ ] `AUTHENTICATION_GUIDE.md` existe
- [ ] `RESUMEN_AUTHENTICATION.md` existe
- [ ] `INICIO_RAPIDO.md` existe
- [ ] `ARQUITECTURA.md` existe
- [ ] `examples/authentication_examples.js.example` existe

---

### Archivos Modificados
- [ ] `src/store/AuthStore.jsx` tiene:
  - [ ] `registerUser` método
  - [ ] `loginEmailPassword` método
  - [ ] `initializeAuth` método
  - [ ] NO tiene `loginGoogle` (eliminado)
  
- [ ] `src/components/templates/LoginTemplate.jsx` tiene:
  - [ ] Formulario con estado local (`useState`)
  - [ ] Función `handleSubmit`
  - [ ] Link a `/register`
  - [ ] NO tiene botón de Google (eliminado)
  
- [ ] `src/routers/routes.jsx` tiene:
  - [ ] Ruta `/register` configurada
  - [ ] Import de `Register` componente
  
- [ ] `src/App.jsx` incluye `/register` en condicional
  
- [ ] `src/main.jsx` tiene:
  - [ ] `AppWrapper` componente
  - [ ] `useEffect` con `initializeAuth()`
  
- [ ] `src/index.js` exporta:
  - [ ] `RegisterTemplate`
  - [ ] `Register`

---

## 🧪 Pruebas Funcionales

### 1. Registro de Usuario
- [ ] Navegar a `http://localhost:5173/register`
- [ ] Página carga correctamente
- [ ] Formulario tiene 4 campos: nombre, email, contraseña, confirmar
- [ ] Validaciones funcionan:
  - [ ] Email inválido muestra error
  - [ ] Contraseña < 6 caracteres muestra error
  - [ ] Contraseñas no coinciden muestra error
- [ ] Al registrar usuario exitosamente:
  - [ ] SweetAlert muestra mensaje de éxito
  - [ ] Redirige a `/login`
  - [ ] (Opcional) Email de confirmación recibido

---

### 2. Verificación en Base de Datos
- [ ] Usuario aparece en `auth.users`
- [ ] Usuario aparece en `public.users`
- [ ] `public.users.id_auth` coincide con `auth.users.id`

**SQL de verificación:**
```sql
-- En Supabase SQL Editor:
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    pu.id_auth as public_id_auth,
    pu.email as public_email,
    pu.name
FROM auth.users au
LEFT JOIN public.users pu ON au.id::text = pu.id_auth
WHERE au.email = 'tu-email-de-prueba@ejemplo.com';
```

---

### 3. Inicio de Sesión
- [ ] Navegar a `http://localhost:5173/login`
- [ ] Página carga correctamente
- [ ] Formulario tiene 2 campos: email, contraseña
- [ ] Al iniciar sesión con credenciales correctas:
  - [ ] Redirige a `/home` o `/`
  - [ ] Usuario está autenticado (ver DevTools → Application → Local Storage)
- [ ] Al iniciar sesión con credenciales incorrectas:
  - [ ] SweetAlert muestra "Credenciales incorrectas"
  - [ ] No redirige

---

### 4. Persistencia de Sesión
- [ ] Con usuario logueado, recargar página (F5)
- [ ] Usuario sigue autenticado (no vuelve a /login)
- [ ] Datos del usuario disponibles en AuthStore

---

### 5. Cerrar Sesión
- [ ] Botón de cerrar sesión funciona (si existe en UI)
- [ ] Usuario es redirigido a `/login`
- [ ] Local Storage limpio (token eliminado)
- [ ] Al intentar acceder a ruta protegida, redirige a `/login`

---

### 6. Protección de Rutas
- [ ] Sin autenticación, acceder a `/home` redirige a `/login`
- [ ] Sin autenticación, acceder a `/configuracion` redirige a `/login`
- [ ] Con autenticación, puede acceder a rutas protegidas

---

## 🔍 Verificación de Consola

### Sin Errores en DevTools
- [ ] Abrir DevTools (F12)
- [ ] Pestaña **Console** no muestra errores críticos
- [ ] Pestaña **Network** muestra llamadas exitosas a Supabase
- [ ] No hay warnings de React (hooks, deps, etc.)

---

### Local Storage
- [ ] Abrir DevTools → Application → Local Storage
- [ ] Verificar que existe key: `sb-<proyecto>-auth-token`
- [ ] El valor es un objeto JSON con:
  - [ ] `access_token` (JWT)
  - [ ] `refresh_token`
  - [ ] `user` (datos del usuario)

---

## 📊 Estados de AuthStore

### Verificar en React DevTools
- [ ] Instalar React DevTools extension
- [ ] Seleccionar componente que usa `useAuthStore`
- [ ] Verificar estado:
  ```javascript
  user: { id, email, ... }       // Cuando está autenticado
  session: { access_token, ... } // Cuando está autenticado
  loading: false                 // Después de cargar
  error: null                    // Sin errores
  ```

---

## 🚨 Problemas Comunes

### "Email not confirmed"
- [ ] **Solución 1:** Deshabilitar confirmación en Dashboard
- [ ] **Solución 2:** Confirmar manualmente con SQL:
  ```sql
  UPDATE auth.users 
  SET email_confirmed_at = NOW() 
  WHERE email = 'tu@email.com';
  ```

---

### Usuario no sincroniza a public.users
- [ ] Verificar que trigger existe (SQL arriba)
- [ ] Volver a ejecutar `database/sync_auth_users.sql`
- [ ] Verificar permisos en Supabase

---

### Session no persiste al recargar
- [ ] Verificar que `main.jsx` tiene `AppWrapper`
- [ ] Verificar que `useEffect` ejecuta `initializeAuth()`
- [ ] Revisar que no hay errores en Console

---

### Build falla en producción
- [ ] Variables de entorno configuradas en hosting
- [ ] Prefijo `VITE_` en todas las variables
- [ ] Rebuild después de cambiar variables

---

## ✅ Checklist Final

### Antes de Producción
- [ ] Todas las pruebas funcionales pasadas
- [ ] Email confirmation **Enabled**
- [ ] RLS (Row Level Security) configurada en `public.users`
- [ ] Variables de entorno en hosting configuradas
- [ ] Backup de base de datos realizado
- [ ] Documentación actualizada
- [ ] Logs de error implementados (opcional)

---

### Documentación
- [ ] Leído `INICIO_RAPIDO.md`
- [ ] Revisado `AUTHENTICATION_GUIDE.md`
- [ ] Consultado `ARQUITECTURA.md` si hay dudas

---

## 📝 Notas Adicionales

**Fecha de implementación:** [Fecha]
**Versión de Supabase:** 2.x
**Versión de React:** 19.x

**Cambios realizados:**
- ✅ Sistema de autenticación propio implementado
- ✅ Google OAuth eliminado completamente
- ✅ Sincronización automática auth.users ↔ public.users
- ✅ Validaciones y manejo de errores
- ✅ Documentación completa

---

## 🎯 Estado General

- [ ] ✅ Todo funciona correctamente
- [ ] ⚠️ Hay warnings menores (especificar):
- [ ] ❌ Hay errores (especificar):

---

**Una vez completado todo, tu sistema de autenticación está listo para usar en producción.**

---

💡 **Tip:** Guarda este checklist para futuras referencias o para onboarding de nuevos desarrolladores.
