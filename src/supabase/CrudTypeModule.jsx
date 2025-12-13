import Swal from "sweetalert2";
import { supabase } from "../index";
const table = "section_module";
export async function getModuleType() {
  
  const { data, error } = await supabase
    .from(table)
    .select()

if(error){
  Swal.fire({
    icon: 'error',
    title: 'Error al obtener los tipos de módulos',
    text: error.message,  
  })
}

  return data;
}
