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
          set({ session, user: session.user });
        } else {
          const validation = await get().validateUserAccess(session.user.id);
          if (!validation.ok) {
            await supabase.auth.signOut();
            set({
              session: null,
              user: null,
              profile: null,
              error: validation.reason,
            });
          } else {
            set({ session, user: session.user });
          }
        }
      } else {
        set({ session: null, user: null, profile: null });
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
      console.log(authUserId);
      
      console.log(profile);
      
      if (profile) {
        set({ profile });
        return profile;
      } else {
        console.warn('No se encontró perfil para el usuario');
        set({ profile: null });
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
      return { ok: false, reason: "Perfil no encontrado" };
    }

    const empleado = await getEmpleadoByPerfil({ perfilId: profile.id });
    
    if ((!empleado || !empleado.is_active) && (profile.app_role == "employee") ) {
      return { ok: false, reason: "Empleado no activo" };
    }

    return { ok: true, profile, empleado };
  },

  // ============================================
  // Registro de usuario
  // ============================================
  registerUser: async (email, password, name = '') => {
    set({ loading: true, error: null, profile: null });
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
        error: null
      });

      // Cargar perfil después del registro
      if (data.user) {
        await get().loadUserProfile(data.user.id);
      }

      return { success: true, data };
    } catch (error) {
      const errorMsg = error.message || 'Error al registrar usuario';
      set({ loading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  // ============================================
  // Login con email y contrase??a
  // ============================================
  loginEmailPassword: async (email, password) => {
    set({ loading: true, error: null, profile: null });
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
      set({ loading: false, error: errorMsg, profile: null });
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
      set({ user: null, session: null, profile: null, error: null });
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

  // Verificar si el usuario es empleado básico
  isEmployee: () => {
    return get().getUserRole() === 'employee';
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));








