import { create } from "zustand";
import { getEmpresas, getEmpresaById, insertEmpresa, updateEmpresa } from "../index";

export const useEmpresasStore = create((set, get) => ({
  dataEmpresas: [],
  empresaSelected: null,
  isLoading: false,

  /**
   * Carga todas las empresas
   */
  loadEmpresas: async () => {
    set({ isLoading: true });
    try {
      const data = await getEmpresas();
      set({ dataEmpresas: data, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Obtiene una empresa por ID
   */
  getEmpresa: async (id) => {
    const data = await getEmpresaById(id);
    set({ empresaSelected: data });
    return data;
  },

  /**
   * Crea una nueva empresa
   */
  createEmpresa: async (payload) => {
    const data = await insertEmpresa(payload);
    const currentData = get().dataEmpresas;
    set({ dataEmpresas: [...currentData, data] });
    return data;
  },

  /**
   * Actualiza una empresa existente
   */
  updateEmpresaStore: async (id, payload) => {
    const data = await updateEmpresa(id, payload);
    const currentData = get().dataEmpresas;
    const updatedData = currentData.map((item) =>
      item.id === id ? data : item
    );
    set({ dataEmpresas: updatedData });
    return data;
  },

  /**
   * Limpia la empresa seleccionada
   */
  clearSelected: () => {
    set({ empresaSelected: null });
  },
}));
