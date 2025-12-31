import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../supabase/supabase.config";
import {
  getUsers,
  getDocType,
  getRoleByName,
  insertAdmin,
  useCompanyStore,
} from "../index";

const Authcontext = createContext();
export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState([]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user == null) {
        setUser(null);
      } else {
        setUser(session?.user);
        insertData(session?.user.id, session?.user.email);
       }
      //  console.log(event);
      //  console.log(session);
    });
    return () => {
      data.subscription;
    };
  }, []);

  const insertData = async (id_auth, email) => { 

      const response = await getUsers({ id_auth: id_auth });
      if(response){
        return; 
      }else{
        // const responseCompany = await insertCompany({id_auth: id_auth});

        // const responseDocType = await getDocType({id_company: responseCompany?.id});
        // const responseRole = await getRoleByName({name: "superadmin"});

        const pUser = {
          email: email,
          is_active: true,
          created_at: new Date(),
          auth_user_id: id_auth
          // app_role: 
          // id_doc_type : responseDocType[0]?.id,
          // id_role: responseRole?.id,
          
          // registration_date: new Date(),
          // id_auth: id_auth
        };
        
        await insertAdmin(pUser);
      }

    }

  return (
    <Authcontext.Provider value={{ user }}>{children}</Authcontext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(Authcontext);
};
