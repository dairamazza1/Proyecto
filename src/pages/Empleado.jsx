import { EmpleadoTemplate, Spinner1, getEmpleadoById } from "../index";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export function Empleado() {
  const { id } = useParams();
  const { data: empleado, isLoading, isError } = useQuery({
    queryKey: ["empleado", id],
    queryFn: () => getEmpleadoById(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  if (id && isLoading) {
    return <Spinner1 />;
  }

  return <EmpleadoTemplate id={id} empleado={empleado} isError={isError} />;
}
