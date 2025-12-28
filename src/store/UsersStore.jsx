import { create } from "zustand"
import { getUsers , getIdAuthSupabase} from "../index"

export const useUsersStore = create((set) => ({
    dataUsers : [],
    showUsers: async () => {
        const idAuth = await getIdAuthSupabase()
console.log(idAuth);

        const response = await getUsers({id_auth: idAuth });
        set({dataUsers: response});
      console.log(response);
        return response;
  

    }

}))