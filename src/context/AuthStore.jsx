import { create } from "zustand";
import { supabase } from "../supabase/supabase.config.jsx";

export const useAuthStore = create((set) =>({
    user: null,
    session: null,
    loading: false,
    error: null,

    // Inicializar sesión al cargar la app
    initializeAuth: async() => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            set({ session, user: session?.user || null });
        } catch (error) {
            console.error('Error al inicializar autenticación:', error);
        }
    },

    // Registro de usuario con email y contraseña
    registerUser: async(email, password, name = '') => {
        set({ loading: true, error: null });
        try {
            // Registrar en Supabase Auth
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

            return { success: true, data };
        } catch (error) {
            const errorMsg = error.message || 'Error al registrar usuario';
            set({ loading: false, error: errorMsg });
            return { success: false, error: errorMsg };
        }
    },

    // Inicio de sesión con email y contraseña
    loginEmailPassword: async(email, password) => {
        set({ loading: true, error: null });
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
                error: null 
            });

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

            set({ loading: false, error: errorMsg });
            return { success: false, error: errorMsg };
        }
    },

    // Cerrar sesión
    cerrarSesion: async() => {
        try {
            await supabase.auth.signOut();
            set({ user: null, session: null, error: null });
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    },

    // Limpiar errores
    clearError: () => set({ error: null })
}))