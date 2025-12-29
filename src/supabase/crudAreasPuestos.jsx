import { supabase } from "../index";

const schema = "test";

export async function getAreasLaborales() {
  const { data, error } = await supabase
    .schema(schema)
    .from("areas_laborales")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getPuestosByArea(areaId) {
  const { data, error } = await supabase
    .schema(schema)
    .from("puestos_laborales")
    .select("id, name, requires_professional_number")
    .eq("id_area", areaId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}
