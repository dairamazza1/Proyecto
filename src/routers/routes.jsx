import { Routes, Route } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  // Categories,
  Configurations,
  Empleado,
  Empleados,
  Home,
  Enfermeria,
  InvitacionesConfig,
  Login,
  Perfil,
  Reportes,
  Register,
  SetPassword,
  Notificaciones,
  ProtectedRoute,
  RoleRoute,
  RegistrarEmpleados,
  Spinner1,
  useUsersStore,
} from "../index";

export function MyRoutes() {
  const { showUsers } = useUsersStore();
  const { isLoading, error } = useQuery({
    queryKey: ["mostrar usuarios"],
    queryFn: showUsers,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <Spinner1 />;
  }
  if (error) {
    return <span>error...</span>;
  }

  return (
    <Routes>
      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute redirectTo="/login" />}>
      <Route path="/" element={<Home />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/enfermeria" element={<Enfermeria />} />
      <Route path="/configuracion" element={<Configurations />} />
        <Route path="/Configuración" element={<Configurations />} />
        <Route
          element={<RoleRoute roles={["admin", "rrhh"]} redirectTo="/perfil" />}
        >
          <Route path="/empleados" element={<Empleados />} />
          <Route path="/empleados/nuevo" element={<RegistrarEmpleados />} />
          <Route path="/empleados/:id" element={<Empleado />} />
          <Route path="/empleado/:id" element={<Empleado />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route
            path="/configuracion/invitaciones"
            element={<InvitacionesConfig />}
          />
          <Route
            path="/Configuración/invitaciones"
            element={<InvitacionesConfig />}
          />
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/set-password" element={<SetPassword />} />
    </Routes>
  );
}
