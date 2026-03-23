import { create } from 'zustand';
import { supabase } from '../api/supabase';

export const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user || null });
      if (session?.user) {
        await get().fetchProfile(session.user.id);
      } else {
        set({ profile: null, loading: false });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user || null });
        if (session?.user) {
          await get().fetchProfile(session.user.id);
        } else {
          set({ profile: null, loading: false });
        }
      });
    } catch (error) {
      console.error('Error initializing auth', error);
      set({ loading: false });
    }
  },

  fetchProfile: async (userId) => {
    try {
      // 1. Intentar obtener el perfil sin lanzar error 406
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;

      // 2. Si el perfil existe, se guarda y se quita el loading
      if (profile) {
        set({ profile, loading: false });
        return;
      }

      // 3. FALLBACK FRONTEND: Si no existe, autocrearlo
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
            role: 'student'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        set({ profile: newProfile, loading: false });
      }

    } catch (error) {
      console.error('Error fetching/creating profile', error);
      // Evitar que la UI quede cargando infinitamente.
      set({ profile: null, loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  }
}));
