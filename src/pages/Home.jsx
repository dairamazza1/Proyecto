import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HomeTemplate,
  Spinner1,
  UserAuth,
  getEmpleadoByPerfil,
  getPerfilActual,
} from "../index";

export function Home() {
  const { user } = UserAuth();

  const {
    data: perfil,
    isLoading: isPerfilLoading,
    error: perfilError,
  } = useQuery({
    queryKey: ["perfilActual", user?.id],
    queryFn: () => getPerfilActual({ authUserId: user?.id }),
    refetchOnWindowFocus: false,
  });

  const {
    data: empleado,
    isLoading: isEmpleadoLoading,
    error: empleadoError,
  } = useQuery({
    queryKey: ["empleadoPerfil", perfil?.id, user?.id],
    queryFn: () =>
      getEmpleadoByPerfil({ perfilId: perfil?.id }),
    enabled: !!perfil?.id,
    refetchOnWindowFocus: false,
  });

  const displayName = useMemo(() => {
    const fullName = `${empleado?.first_name ?? ""} ${
      empleado?.last_name ?? ""
    }`.trim();
    if (fullName) return fullName;
    return perfil?.email || user?.email || "Usuario";
  }, [empleado, perfil, user]);

  if (isPerfilLoading || isEmpleadoLoading) {
    return <Spinner1 />;
  }

  if (perfilError || empleadoError) {
    return (
      <span>
        ha ocurrido un error: {perfilError?.message || empleadoError?.message}
      </span>
    );
  }

  return <HomeTemplate displayName={displayName} />;
}
