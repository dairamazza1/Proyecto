import Swal from "sweetalert2";
import { supabase } from "../index";
const schema = "test";
const table = "perfiles";


export async function getUsers(p) {
  const { data } = await supabase
    .schema(schema)
    .from(table)
    .select()
    .eq("auth_user_id", p.id_auth)
    .maybeSingle();
  return data;
}

export async function insertAdmin(p) {
     
    const {error} = await supabase.schema(schema).from(table).insert(p);
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
