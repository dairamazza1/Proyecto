//acá se muestran datos. El template es el que tiene la estructura de la página

import { Navigate } from "react-router-dom";
import { InvitacionesConfigTemplate, usePermissions } from "../index";

export function InvitacionesConfig() {
  const { canCreate } = usePermissions();
  if (!canCreate("empleados")) {
    return <Navigate to="/perfil" replace />;
  }
  return <InvitacionesConfigTemplate />;
}
