import { supabase } from "./supabase.config.jsx";
const table = "perfiles";


export async function getUsers(p) {
  const { data } = await supabase
    
    .from(table)
    .select("id, email, auth_user_id, app_role_id, app_role:app_roles(name)")
    .eq("auth_user_id", p.id_auth)
    .maybeSingle();
  return data;
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
