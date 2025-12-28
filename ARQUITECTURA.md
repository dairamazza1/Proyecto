# 🏗️ Arquitectura del Sistema de Autenticación

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CAPA DE PRESENTACIÓN                        │
│                                                                     │
│  ┌──────────────────┐           ┌──────────────────┐              │
│  │  LoginTemplate   │           │ RegisterTemplate │              │
│  │  /login          │           │  /register       │              │
│  │                  │           │                  │              │
│  │  • Email         │           │  • Nombre        │              │
│  │  • Contraseña    │           │  • Email         │              │
│  │  • Validaciones  │           │  • Contraseña    │              │
│  │  • Link registro │           │  • Confirmar     │              │
│  └────────┬─────────┘           └────────┬─────────┘              │
│           │                              │                         │
│           └──────────────┬───────────────┘                         │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CAPA DE ESTADO (ZUSTAND)                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                      AuthStore.jsx                          │  │
│  │                                                             │  │
│  │  Estado:                                                    │  │
│  │    • user: Usuario autenticado                             │  │
│  │    • session: Sesión activa                                │  │
│  │    • loading: Estado de carga                              │  │
│  │    • error: Mensaje de error                               │  │
│  │                                                             │  │
│  │  Métodos:                                                   │  │
│  │    • registerUser(email, password, name)                   │  │
│  │    • loginEmailPassword(email, password)                   │  │
│  │    • cerrarSesion()                                        │  │
│  │    • initializeAuth()                                      │  │
│  │    • clearError()                                          │  │
│  └─────────────────────┬───────────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CAPA DE SERVICIOS (SUPABASE)                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Supabase Client (supabase.config.jsx)          │  │
│  │                                                             │  │
│  │  • supabase.auth.signUp()         → Registro              │  │
│  │  • supabase.auth.signInWithPassword() → Login             │  │
│  │  • supabase.auth.signOut()        → Logout                │  │
│  │  • supabase.auth.getSession()     → Sesión actual         │  │
│  └─────────────────────┬───────────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       CAPA DE BASE DE DATOS                         │
│                           (PostgreSQL)                              │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                     auth.users                             │   │
│  │  (Tabla nativa de Supabase Auth)                          │   │
│  │                                                            │   │
│  │  • id (uuid)                                              │   │
│  │  • email                                                  │   │
│  │  • encrypted_password (hash bcrypt) 🔒                    │   │
│  │  • email_confirmed_at                                     │   │
│  │  • raw_user_meta_data (json) → {name}                    │   │
│  │  • created_at, updated_at                                 │   │
│  └───────────────────┬────────────────────────────────────────┘   │
│                      │                                             │
│                      │ TRIGGER: on_auth_user_created               │
│                      │ (sincronización automática)                 │
│                      ▼                                             │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    public.users                            │   │
│  │  (Tabla de negocio/aplicación)                            │   │
│  │                                                            │   │
│  │  • id (bigint)                                            │   │
│  │  • id_auth (text) → FK a auth.users.id                   │   │
│  │  • email                                                  │   │
│  │  • name                                                   │   │
│  │  • registration_date                                      │   │
│  │  • state (ACTIVE/INACTIVE)                                │   │
│  │  • id_doc_type, doc_number, tel                          │   │
│  │  • id_role → FK a role                                   │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Flujo de Datos - Registro de Usuario

```
1. Usuario completa formulario (/register)
   ↓
2. RegisterTemplate valida datos (frontend)
   ↓
3. AuthStore.registerUser(email, password, name)
   ↓
4. Supabase Client → supabase.auth.signUp()
   ↓
5. Supabase Auth:
   • Hashea contraseña con bcrypt 🔒
   • Crea registro en auth.users
   • Genera token de sesión JWT
   ↓
6. Trigger SQL: on_auth_user_created
   • Detecta INSERT en auth.users
   • Ejecuta handle_new_user()
   ↓
7. Función handle_new_user():
   • Extrae datos de auth.users
   • INSERT en public.users con id_auth
   ↓
8. Supabase retorna:
   { user, session, error: null }
   ↓
9. AuthStore actualiza estado:
   • user = datos del usuario
   • session = token JWT
   • loading = false
   ↓
10. RegisterTemplate:
    • Muestra SweetAlert de éxito ✅
    • Redirige a /login
```

---

## 🔐 Flujo de Datos - Inicio de Sesión

```
1. Usuario ingresa email y contraseña (/login)
   ↓
2. LoginTemplate valida campos
   ↓
3. AuthStore.loginEmailPassword(email, password)
   ↓
4. Supabase Client → supabase.auth.signInWithPassword()
   ↓
5. Supabase Auth:
   • Busca usuario por email en auth.users
   • Compara hash de contraseña con bcrypt
   • Valida email_confirmed_at (si está habilitado)
   ↓
6. ¿Credenciales correctas?
   │
   ├─ SÍ ✅
   │  ├─ Genera nuevo token JWT
   │  ├─ Crea sesión activa
   │  └─ Retorna { user, session, error: null }
   │
   └─ NO ❌
      └─ Retorna { error: "Invalid login credentials" }
      ↓
7. AuthStore actualiza estado:
   • user = datos del usuario
   • session = token JWT activo
   • error = null o mensaje de error
   ↓
8. LoginTemplate:
   ├─ Éxito → Redirige a /home 🏠
   └─ Error → Muestra SweetAlert con error ⚠️
```

---

## 🔄 Flujo de Persistencia de Sesión

```
1. Usuario recarga la página o cierra/abre navegador
   ↓
2. main.jsx → AppWrapper se monta
   ↓
3. useEffect ejecuta initializeAuth()
   ↓
4. AuthStore.initializeAuth()
   ↓
5. Supabase Client → supabase.auth.getSession()
   ↓
6. Supabase verifica:
   • localStorage: Token JWT guardado
   • Validez del token (expiración)
   ↓
7. ¿Token válido?
   │
   ├─ SÍ ✅
   │  └─ Retorna { session, user }
   │
   └─ NO ❌
      └─ Retorna { session: null }
      ↓
8. AuthStore actualiza estado
   ↓
9. ProtectedRoute verifica autenticación:
   ├─ Autenticado → Renderiza ruta protegida
   └─ No autenticado → Redirige a /login
```

---

## 🗂️ Estructura de Carpetas

```
proyecto/
│
├── src/
│   ├── components/
│   │   ├── templates/
│   │   │   ├── LoginTemplate.jsx         ✅ Modificado
│   │   │   └── RegisterTemplate.jsx      ✨ Nuevo
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   └── Register.jsx                  ✨ Nuevo
│   │
│   ├── store/
│   │   └── AuthStore.jsx                 ✅ Modificado (completo)
│   │
│   ├── routers/
│   │   └── routes.jsx                    ✅ Modificado (+ruta /register)
│   │
│   ├── supabase/
│   │   └── supabase.config.jsx           ✔️ Sin cambios
│   │
│   ├── App.jsx                           ✅ Modificado (incluye /register)
│   ├── main.jsx                          ✅ Modificado (AppWrapper)
│   └── index.js                          ✅ Modificado (exports)
│
├── database/
│   ├── auth.sql                          ✔️ Referencia
│   ├── public.sql                        ✔️ Referencia
│   ├── sync_auth_users.sql               ✨ Nuevo (trigger)
│   └── additional_sql_scripts.sql        ✨ Nuevo (utilidades)
│
├── examples/
│   └── authentication_examples.js.example ✨ Nuevo (código ejemplo)
│
├── INICIO_RAPIDO.md                      ✨ Nuevo
├── AUTHENTICATION_GUIDE.md               ✨ Nuevo (guía completa)
└── RESUMEN_AUTHENTICATION.md             ✨ Nuevo (resumen ejecutivo)
```

**Leyenda:**
- ✨ Nuevo: Archivo creado
- ✅ Modificado: Archivo actualizado
- ✔️ Sin cambios: Archivo existente sin modificar

---

## 🔑 Conceptos Clave

### 1. **Hashing de Contraseñas**
```
Contraseña ingresada: "password123"
         ↓
Supabase bcrypt.hash()
         ↓
Hash almacenado: "$2a$10$N9qo8uLOickgx2ZMRZoM..."
```

**Importante:** 
- ✅ Hashing es unidireccional (no se puede revertir)
- ✅ Mismo password genera hash diferente cada vez (salt)
- ✅ Comparación usa bcrypt.compare() internamente

### 2. **JWT (JSON Web Token)**
```json
{
  "sub": "usuario-uuid",
  "email": "usuario@ejemplo.com",
  "role": "authenticated",
  "aud": "authenticated",
  "exp": 1735689600,
  "iat": 1735603200
}
```

**Almacenamiento:**
- Frontend: localStorage → `sb-<proyecto>-auth-token`
- Renovación automática cada 1 hora

### 3. **Trigger Automático**
```sql
INSERT INTO auth.users → Dispara → on_auth_user_created
                            ↓
                    handle_new_user()
                            ↓
                    INSERT INTO public.users
```

**Ventajas:**
- ✅ Sincronización automática
- ✅ No requiere código adicional
- ✅ Consistencia garantizada

---

## 📈 Escalabilidad y Mejoras Futuras

### Fase 1: ✅ Completado
- [x] Registro con email/contraseña
- [x] Login con validaciones
- [x] Persistencia de sesión
- [x] Sincronización automática

### Fase 2: 🔜 Próximos pasos
- [ ] Recuperación de contraseña
- [ ] Cambio de contraseña
- [ ] Actualización de perfil
- [ ] Verificación de email por SMS

### Fase 3: 🚀 Avanzado
- [ ] Autenticación de dos factores (2FA)
- [ ] Roles y permisos avanzados
- [ ] OAuth con GitHub, Facebook, etc.
- [ ] Auditoría de sesiones

---

## 📚 Recursos Adicionales

- 📖 [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- 🔐 [bcrypt Explained](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/)
- 🎓 [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- ⚛️ [React Authentication Patterns](https://react.dev/learn/synchronizing-with-effects)

---

**Sistema completamente funcional y documentado. Listo para producción.**
