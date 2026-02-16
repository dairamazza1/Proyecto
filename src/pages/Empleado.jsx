import {
  EmpleadoTemplate,
  Spinner1,
  getEmpleadoById,
  getSucursalEmpleado,
  usePermissions,
} from "../index";
import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export function Empleado() {
  const { canRead } = usePermissions();
  const canViewEmpleados = canRead("empleados");
  const { id } = useParams();
  const { data: empleado, isLoading, isError } = useQuery({
    queryKey: ["empleado", id],
    queryFn: () => getEmpleadoById(id),
    enabled: !!id && canViewEmpleados,
    refetchOnWindowFocus: false,
  });

  const { data: sucursalEmpleado } = useQuery({
    queryKey: ["sucursalEmpleado", id],
    queryFn: () => getSucursalEmpleado(id),
    enabled: !!id && canViewEmpleados,
    refetchOnWindowFocus: false,
  });

  if (!canViewEmpleados) {
    return <Navigate to="/perfil" replace />;
  }

  if (id && isLoading) {
    return <Spinner1 />;
  }

  return (
    <EmpleadoTemplate
      id={id}
      empleado={empleado}
      sucursalEmpleado={sucursalEmpleado}
      isError={isError}
    />
  );
}
