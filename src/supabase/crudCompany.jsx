import Swal from "sweetalert2";
import { supabase } from "../index";
const table = "company";
export async function insertCompany(p) {
  //devuelve un único objeto con maybeSingle en vez de un array
  const { data, error } = await supabase
    .from(table)
    .insert(p)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Insert company error:", error);
    throw error;
  }
  if (error) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.message,
    });
    return;
  }
  return data;
}

export async function ShowCompanyByIDUser(){
  const {data,error} = await supabase.rpc("mostrarempresaporiduser",p)
  .maybeSingle();

  //   if (error) {
  //   Swal.fire({
  //     icon: "error",
  //     title: "Oops... Error mostrar empresa x usuario",
  //     text: error.message,
  //   });
  //   return ;
  // }
  return data;
}
