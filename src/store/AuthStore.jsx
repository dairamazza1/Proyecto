import { create } from "zustand";
import { supabase } from "../supabase/supabase.config.jsx";

export const useAuthStore = create((set) =>({
  loginGoogle: async() => {
        try {
            const {data, error} = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
        } catch (error) {
            console.error('Error durante signInWithOAuth:', error); 
        }
    },
    cerrarSesion: async()=>{
        await supabase.auth.signOut();
    }
}))