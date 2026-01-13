import { create } from "zustand"
import { getUsers, getIdAuthSupabase } from "../index"

export const useUsersStore = create((set) => ({
    dataUsers: [],
    showUsers: async () => {
        const idAuth = await getIdAuthSupabase()

        if (!idAuth) {
            set({ dataUsers: null });
            return null;
        }

        const response = await getUsers({ id_auth: idAuth });
        set({ dataUsers: response });
        return response;
    }
}))