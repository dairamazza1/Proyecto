import Swal from "sweetalert2";
import { supabase } from "../index";
const table = "perfiles";


export async function getUsers(p) {
  const { data } = await supabase
    
    .from(table)
    .select()
    .eq("auth_user_id", p.id_auth)
    .maybeSingle();
  return data;
}

export async function insertAdmin(p) {
     
    const {error} = await supabase.from(table).insert(p);
     if (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.message,
        })
    };
}

export async function getIdAuthSupabase(){
  const {data: {session}} = await supabase.auth.getSession();
  if(session != null){
    const {user} = session;
    const idAuth = user.id;
    return idAuth;
  }
  return null;
}
