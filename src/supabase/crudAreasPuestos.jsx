import { supabase } from "../index";


export async function getAreasLaborales() {
  const { data, error } = await supabase
    
    .from("areas_laborales")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getPuestosByArea(areaId) {
  const { data, error } = await supabase
    
    .from("puestos_laborales")
    .select("id, name, requires_professional_number")
    .eq("id_area", areaId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getPuestoById(puestoId) {
  const { data, error } = await supabase
    
    .from("puestos_laborales")
    .select("id, id_area, requires_professional_number")
    .eq("id", puestoId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
