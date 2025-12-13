import { getModuleType } from "../index";
import { create } from "zustand";

export const useModuleSectionStore = create((set) => ({
  dataModuleSection: [],
  getModuleSection: async () => {
    const response = await getModuleType();
    
    set({ dataModuleSection: response });
    return response;
  },
}));
