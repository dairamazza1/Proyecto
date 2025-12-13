import { supabase } from "../index";
const table = "role";
export async function getRoleByName(p) {
  const { data } = await supabase
    .from(table)
    .select()
    .eq("name", p.name).maybeSingle();

  return data;
}
