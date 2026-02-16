import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import {
  EmpleadosTemplate,
  Spinner1,
  usePermissions,
  useCompanyStore,
  useEmpleadosStore,
  useSucursalesStore,
} from "../index";

export function Empleados() {
  const { canRead } = usePermissions();
  const canViewEmpleados = canRead("empleados");
  const { showEmpleados, searchEmpleados, buscador, setDataEmpleados } =
    useEmpleadosStore();
  const { dataCompany } = useCompanyStore();
  const {
    showSucursales,
    sucursalSeleccionada,
    showEmpleadosBySucursal,
    searchEmpleadosBySucursal,
  } = useSucursalesStore();

  useQuery({
    queryKey: ["mostrar sucursales", dataCompany?.id],
    queryFn: () => showSucursales({ empresa_id: dataCompany?.id }),
    enabled: !!dataCompany && canViewEmpleados,
    refetchOnWindowFocus: false,
  });

  const queryFn = sucursalSeleccionada
    ? async () => {
        const data = await showEmpleadosBySucursal({
          sucursal_id: sucursalSeleccionada,
          empresa_id: dataCompany?.id,
        });
        setDataEmpleados(data);
        return data;
      }
    : async () => {
        const data = await showEmpleados({ empresa_id: dataCompany?.id });
        return data;
      };

  const searchQueryFn = sucursalSeleccionada
    ? async () => {
        const data = await searchEmpleadosBySucursal({
          sucursal_id: sucursalSeleccionada,
          empresa_id: dataCompany?.id,
          search: buscador,
        });
        setDataEmpleados(data);
        return data;
      }
    : async () => {
        const data = await searchEmpleados({
          empresa_id: dataCompany?.id,
          search: buscador,
        });
        return data;
      };

  const { isLoading, error } = useQuery({
    queryKey: ["mostrar empleados", dataCompany?.id, sucursalSeleccionada],
    queryFn,
    enabled: !!dataCompany && canViewEmpleados,
    refetchOnWindowFocus: false,
  });

  const { error: searchError } = useQuery({
    queryKey: ["buscar empleados", buscador, dataCompany?.id, sucursalSeleccionada],
    queryFn: searchQueryFn,
    enabled: !!dataCompany && canViewEmpleados,
    refetchOnWindowFocus: false,
  });

  if (!canViewEmpleados) {
    return <Navigate to="/perfil" replace />;
  }

  if (isLoading) {
    return <Spinner1 />;
  }
  if (error || searchError) {
    const message = error?.message || searchError?.message;
    return <span>ha ocurrido un error: {message}</span>;
  }

  return <EmpleadosTemplate />;
}
