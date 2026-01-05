import Swal from "sweetalert2";
import { supabase } from "../index";
const table = "empresa";
const schema = "test";

// export async function insertCompany(p) {
//   //devuelve un único objeto con maybeSingle en vez de un array
//   const { data, error } = await supabase
//     .from(table)
//     .insert(p)
//     .select()
//     .maybeSingle();

//   if (error) {
//     console.error("Insert company error:", error);
//     throw error;
//   }
//   if (error) {
//     Swal.fire({
//       icon: "error",
//       title: "Oops...",
//       text: error.message,
//     });
//     return;
//   }
//   return data;
// }

export async function ShowEmpresaByIDUser(p) {
  const authUserId = p?.id_auth ?? p?._auth_user_id ?? null;
  if (!authUserId) return null;
  const { data, error } = await supabase
    .schema(schema)
    .rpc("mostrar_empresa_por_auth_user", { id_auth: authUserId })
    .maybeSingle();

  //   if (error) {
  //   Swal.fire({
  //     icon: "error",
  //     title: "Oops... Error mostrar empresa x usuario",
  //     text: error.message,
  //   });
  //   return ;
  // }
  if (error) throw error;
  return data;
}
