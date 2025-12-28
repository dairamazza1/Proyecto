import { create } from "zustand";
import { getSucursales, getEmpleadosBySucursal, searchEmpleadosBySucursal } from "../index";

export const useSucursalesStore = create((set) => ({
  dataSucursales: [],
  sucursalSeleccionada: null,
  loading: false,
  error: null,

  setSucursalSeleccionada: (sucursal) => {
    set({ sucursalSeleccionada: sucursal });
  },

  showSucursales: async (p) => {
    set({ loading: true, error: null });
    try {
      const response = await getSucursales(p);
      set({ dataSucursales: response, loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error });
      throw error;
    }
  },

  showEmpleadosBySucursal: async (p) => {
    const response = await getEmpleadosBySucursal(p);
    return response;
  },

  searchEmpleadosBySucursal: async (p) => {
    const response = await searchEmpleadosBySucursal(p);
    return response;
  },
}));
