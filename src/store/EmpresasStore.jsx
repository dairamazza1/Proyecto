import { create } from "zustand";
import {  ShowEmpresaByIDUser } from "../index";

export const useCompanyStore = create((set) => ({
    dataCompany: [],
    showCompany: async(p) => {
        // console.log(p);
        
        const response = await ShowEmpresaByIDUser(p)
        set({dataCompany: response});

        // console.log("test");
        
        // console.log(response);
        
        return response;
    }
    //,
    // insertCompanyObj: async(p) => {
    //     const response = await insertCompany(p);
    //     console.log("response store", response);
        
    //     return response;
    // } 
}));