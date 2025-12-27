//acǭ se muestran datos. El template es el que tiene la estructura de la pǭgina
import { useQuery } from "@tanstack/react-query";
import {
  EmpleadosTemplate,
  Spinner1,
  useCompanyStore,
  useEmpleadosStore,
} from "../index";

export function Home() {
  const { showEmpleados, searchEmpleados, buscador } = useEmpleadosStore();
  const { dataCompany } = useCompanyStore();

  const { isLoading, error } = useQuery({
    queryKey: ["mostrar empleados", dataCompany?.id],
    queryFn: () => showEmpleados({ empresa_id: dataCompany?.id }),
    enabled: !!dataCompany,
    refetchOnWindowFocus: false,
  });

  const { error: searchError } = useQuery({
    queryKey: ["buscar empleados", buscador, dataCompany?.id],
    queryFn: () =>
      searchEmpleados({ empresa_id: dataCompany?.id, search: buscador }),
    enabled: !!dataCompany,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <Spinner1 />;
  }
  if (error || searchError) {
    const message = error?.message || searchError?.message;
    return <span>ha ocurrido un error: {message}</span>;
  }

  return <EmpleadosTemplate />;
}
