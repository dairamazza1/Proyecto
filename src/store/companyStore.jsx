import { create } from "zustand";
import { insertCompany, ShowCompanyByIDUser } from "../index";

export const useCompanyStore = create((set) => ({
    dataCompany: [],
    showCompany: async(p) => {
        const response = await ShowCompanyByIDUser(p)
        set({dataCompany: response});
        return response;
    },
    insertCompanyObj: async(p) => {
        const response = await insertCompany(p);
        console.log("response store", response);
        
        return response;
    } 
}));