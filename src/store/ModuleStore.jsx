import { create } from "zustand"
import { deleteModule, editModule, getModule, InsertModule, searchModule } from "../index"

export const useModulesStore = create((get,set) => ({
    buscador: "",
    setBuscador: (p) => {
        set({ buscador : p});
    },
    dataModules : [],
    moduleItemSelected: [],
    params : {    },
    showModules : async (p) =>{
        const response = await getModule(p);
        set({params : p});
        set({dataModules: response})
        set({moduleItemSelected : response[0]})
        return response;
    },

    selectModule : (p) => {
        set({moduleItemSelected: p});
    },
    insertModule : async(p,file) =>{
        await InsertModule(p,file);
        const {showModules} = get();
        const {params} = get();

        set(showModules(params));
    },
    deleteModule: async(p) =>{
        await deleteModule();

        const {showModules} = get();
        const {params} = get();

        set(showModules(params));
    },
    editModule: async(p, fileOld, fileNew) =>{
        await editModule(p,fileOld,fileNew);

        const {showModules} = get();
        const {params} = get();

        set(showModules(params));
    },
    searchModule: async(p) =>{
        const response = await searchModule(p);

        set({dataModules : response});
        return response;
    }
}))