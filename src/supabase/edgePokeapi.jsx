import { supabase } from "./supabase.config.jsx";

export async function fetchPokemonViaEdge({ pokemon }) {
  const { data, error } = await supabase.functions.invoke("pokeapi", {
    body: { pokemon },
  });
  if (error) throw error;
  return data;
}