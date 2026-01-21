import { create } from "zustand";
import { supabase } from "../supabase/supabase.config.jsx";
import { getUsers } from "../supabase/crudUsers";
import { getEmpleadoByPerfil } from "../index.js";

/**
 * ============================================
 * AUTH STORE CON PERMISOS
 * ============================================
 * 
 * Store centralizado que maneja:
 * - Autenticación (user, session)
 * - Perfil del usuario (profile con app_role)
 * - Estado de carga
 * 
 * CAMBIOS PRINCIPALES:
 * 1. Se agregó campo 'profile' que contiene app_role
 * 2. Se carga el perfil automáticamente después del login
 * 3. Se expone el rol para usar en toda la app
 */

export const useAuthStore = create((set, get) => ({
  // Estado
  user: null,
  session: null,
  profile: null,  // ← NUEVO: Contiene { id, email, app_role, ... }
  empleado: null,
  loading: true,
  error: null,

  // ============================================
  // Inicializar sesión al cargar la app
  // ============================================
  initializeAuth: async ({ skipProfileCheck } = {}) => {
    set({ loading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        if (skipProfileCheck) {
          set({ session, user: session.user, empleado: null });
        } else {
          const validation = await get().validateUserAccess(session.user.id);
          if (!validation.ok) {
            await supabase.auth.signOut();
            set({
              session: null,
              user: null,
              profile: null,
              empleado: null,
              error: validation.reason,
            });
          } else {
            set({ session, user: session.user });
          }
        }
      } else {
        set({ session: null, user: null, profile: null, empleado: null });
      }
    } catch (error) {
      console.error('Error al inicializar autenticación:', error);
      set({ error: error.message });
    }
    set({ loading: false });
  },

  // ============================================
  // NUEVO: Cargar perfil del usuario desde BD
  // ============================================
  loadUserProfile: async (authUserId) => {
    try {
      const profile = await getUsers({ id_auth: authUserId });
      // console.log(authUserId);
      
      // console.log(profile);
      
      if (profile) {
        set({ profile });
        return profile;
      } else {
        console.warn('No se encontró perfil para el usuario');
        set({ profile: null, empleado: null });
        return null;
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      set({ error: error.message });
      return null;
    }
  },

  // ============================================
  // Validar perfil y empleado activo
  // ============================================
  validateUserAccess: async (authUserId) => {
    const profile = await get().loadUserProfile(authUserId);
    if (!profile?.id) {
      set({ empleado: null });
      return { ok: false, reason: "Perfil no encontrado" };
    }

    let empleado = null;
    try {
      empleado = await getEmpleadoByPerfil({ perfilId: profile.id });
    } catch (error) {
      console.error("Error al cargar empleado del perfil:", error);
      empleado = null;
    }

    set({ empleado });
    
    if ((!empleado || !empleado.is_active) && (profile.app_role == "employee") ) {
      return { ok: false, reason: "Empleado no activo" };
    }

    return { ok: true, profile, empleado };
  },

  // ============================================
  // Registro de usuario
  // ============================================
  registerUser: async (email, password, name = '') => {
    set({ loading: true, error: null, profile: null, empleado: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      });

      if (error) throw error;

      set({
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
        empleado: null
      });

      // Cargar perfil después del registro
      if (data.user) {
        await get().loadUserProfile(data.user.id);
      }

      return { success: true, data };
    } catch (error) {
      const errorMsg = error.message || 'Error al registrar usuario';
      set({ loading: false, error: errorMsg, empleado: null });
      return { success: false, error: errorMsg };
    }
  },

  // ============================================
  // Login con email y contrase??a
  // ============================================
  loginEmailPassword: async (email, password) => {
    set({ loading: true, error: null, profile: null, empleado: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (!data.user) {
        throw new Error("Usuario no encontrado.");
      }
      const validation = await get().validateUserAccess(data.user.id);
      if (!validation.ok) {
        await supabase.auth.signOut();
        set({
          user: null,
          session: null,
          profile: null,
          empleado: null,
          loading: false,
          error: validation.reason,
        });
        return { success: false, error: validation.reason };
      }
      set({
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
      });
      return { success: true, data };
    } catch (error) {
      let errorMsg = 'Error al iniciar sesi??n';
      if (error.message.includes('Invalid login credentials')) {
        errorMsg = 'Credenciales incorrectas';
      } else if (error.message.includes('Email not confirmed')) {
        errorMsg = 'Email no confirmado. Revisa tu correo.';
      } else {
        errorMsg = error.message;
      }
      set({ loading: false, error: errorMsg, profile: null, empleado: null });
      return { success: false, error: errorMsg };
    }
  },  // ============================================
  // Cerrar sesión
  // ============================================
  cerrarSesion: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      set({ user: null, session: null, profile: null, empleado: null, error: null });
    }
  },

  // ============================================
  // Helpers
  // ============================================
  
  // Obtener rol del usuario actual
  getUserRole: () => {
    const profile = get().profile;
    return profile?.app_role || 'employee'; // Default: employee
  },

  // Verificar si el usuario es superadmin
  isSuperAdmin: () => {
    return get().getUserRole() === 'superadmin';
  },

  // Verificar si el usuario es RRHH
  isRRHH: () => {
    return get().getUserRole() === 'rrhh';
  },


  // Verificar si el usuario es admin
  isAdmin: () => {
    const role = get().getUserRole();
    return role === 'admin' || role === 'superadmin';
  },

  // Verificar si es empleado enfermero/a
  isNurseEmployee: () => {
    if (get().getUserRole() !== 'employee') return false;
    const empleado = get().empleado;
    const puesto = empleado?.puesto?.name ?? empleado?.puesto ?? '';
    return String(puesto).trim().toLowerCase() === 'enfermero/a';
  },

  // Default tab para enfermeria segun turno
  defaultTabFromShift: (shift) => {
    const raw = String(shift ?? "").trim().toLowerCase();
    if (raw === "manana") return "manana";
    if (raw === "tarde") return "tarde";
    if (raw === "noche") return "noche";
    return "manana";
  },

  // Permiso de edicion para registros de enfermeria
  canEditNurseRecord: (row) => {
    const role = get().getUserRole();
    if (role === 'admin' || role === 'superadmin') return true;
    if (role !== 'employee') return false;
    const empleado = get().empleado;
    const puesto = empleado?.puesto?.name ?? empleado?.puesto ?? '';
    if (String(puesto).trim().toLowerCase() !== 'enfermero/a') return false;
    
    const perfilId = get().profile?.id;
    const createdBy = row?.created_by;
    if (!perfilId || createdBy === null || createdBy === undefined) {
      return false;
    }
    const isOwner = String(createdBy) === String(perfilId);
    if (!isOwner) return false;
    const createdAt = row?.created_at;
    if (!createdAt) return false;
    const createdAtMs = new Date(createdAt).getTime();
    if (Number.isNaN(createdAtMs)) return false;
    return Date.now() <= createdAtMs + 24 * 60 * 60 * 1000;
  },
  // Verificar si el usuario es empleado básico
  isEmployee: () => {
    return get().getUserRole() === 'employee';
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));










