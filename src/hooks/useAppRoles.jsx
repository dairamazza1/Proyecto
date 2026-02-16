import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/supabase.config.jsx";

export function useAppRoles() {
  return useQuery({
    queryKey: ["appRoles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_roles")
        .select("id, name")
        .order("id", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    refetchOnWindowFocus: false,
  });
}
