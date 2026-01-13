import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/supabase.config";

const Authcontext = createContext();
export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState([]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user == null) {
        setUser(null);
      } else {
        setUser(session?.user);
      }
      //  console.log(event);
      //  console.log(session);
    });
    return () => {
      data.subscription;
    };
  }, []);

  return (
    <Authcontext.Provider value={{ user }}>{children}</Authcontext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(Authcontext);
};
