import { create } from "zustand";
import { supabase } from "../supabase/supabase.config.jsx";
import { getUsers } from "../supabase/crudUsers";

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
  initializeAuth: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ session, user: session.user });
        // Cargar perfil con el rol
        await get().loadUserProfile(session.user.id);
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
  // Login con email y contraseña
  // ============================================
  loginEmailPassword: async (email, password) => {
    set({ loading: true, error: null, profile: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
        profile: null // Limpiar perfil antes de cargar el nuevo
      });

      // Cargar perfil después del login
      if (data.user) {
        await get().loadUserProfile(data.user.id);
      }

      return { success: true, data };
    } catch (error) {
      let errorMsg = 'Error al iniciar sesión';

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
  },

  // ============================================
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
