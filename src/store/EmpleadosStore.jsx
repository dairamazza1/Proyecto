import { create } from "zustand";
import { getEmpleados, insertEmpleado, searchEmpleados } from "../index";

export const useEmpleadosStore = create((set, get) => ({
  buscador: "",
  setBuscador: (p) => {
    set({ buscador: p });
  },
  dataEmpleados: [],
  loading: false,
  error: null,
  params: {},
  showEmpleados: async (p) => {
    const response = await getEmpleados(p);
    set({ params: p });
    set({ dataEmpleados: response });
    return response;
  },
  searchEmpleados: async (p) => {
    const response = await searchEmpleados(p);
    set({ dataEmpleados: response });
    return response;
  },
  createEmpleado: async (p) => {
    set({ loading: true, error: null });
    try {
      const response = await insertEmpleado(p);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error });
      throw error;
    }
  },
}));
