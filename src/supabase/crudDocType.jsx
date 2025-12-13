import { supabase } from "../index";
const table = "doctype";
export async function getDocType(p) {
  const { data } = await supabase
    .from(table)
    .select()
    .eq("id_company", p.id_company);

  return data;
}
