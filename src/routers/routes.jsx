import { Routes, Route } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Configurations,
  Empleado,
  Empleados,
  Home,
  Enfermeria,
  InvitacionesConfig,
  Login,
  Paciente,
  Pacientes,
  Perfil,
  Reportes,
  Register,
  SetPassword,
  Notificaciones,
  Permisos,
  ProtectedRoute,
  ProtectedByPermission,
  RegistrarEmpleados,
  Spinner1,
  useUsersStore,
} from "../index";
import { FEATURES } from "../utils/features";

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
        <Route
          path="/perfil"
          element={
            <ProtectedByPermission
              resource={FEATURES.PERFIL}
              action="view"
              redirectTo="/"
            >
              <Perfil />
            </ProtectedByPermission>
          }
        />
        <Route
          path="/enfermeria"
          element={
            <ProtectedByPermission
              resource={FEATURES.ENFERMERIA}
              action="view"
              redirectTo="/"
            >
              <Enfermeria />
            </ProtectedByPermission>
          }
        />
        <Route
          path="/configuracion"
          element={
            <ProtectedByPermission
              resource={FEATURES.PERFIL}
              action="view"
              redirectTo="/"
            >
              <Configurations />
            </ProtectedByPermission>
          }
        />
        <Route
          path="/permisos"
          element={
            <ProtectedByPermission
              resource={FEATURES.PERMISOS}
              action="view"
              redirectTo="/configuracion"
            >
              <Permisos />
            </ProtectedByPermission>
          }
        />
        <Route path="/Configuración" element={<Configurations />} />

        <Route
          path="/empleados"
          element={
            <ProtectedByPermission
              resource={FEATURES.EMPLEADOS}
              action="view"
              redirectTo="/perfil"
            >
              <Empleados />
            </ProtectedByPermission>
          }
        />
        <Route
          path="/empleados/nuevo"
          element={
            <ProtectedByPermission
              resource={FEATURES.EMPLEADOS}
              action="create"
              redirectTo="/perfil"
            >
              <RegistrarEmpleados />
            </ProtectedByPermission>
          }
        />
        <Route
          path="/empleados/:id"
          element={
            <ProtectedByPermission
              resource={FEATURES.EMPLEADOS}
              action="view"
              redirectTo="/perfil"
            >
              <Empleado />
            </ProtectedByPermission>
          }
        />
        <Route
          path="/pacientes"
          element={
            <ProtectedByPermission
              resource={FEATURES.PACIENTES}
              action="view"
              redirectTo="/perfil"
            >
              <Pacientes />
            </ProtectedByPermission>
          }
        />
        <Route
          path="/paciente/:id"
          element={
            <ProtectedByPermission
              resource={FEATURES.PACIENTES}
              action="view"
              redirectTo="/perfil"
            >
              <Paciente />
            </ProtectedByPermission>
          }
        />
        <Route
          path="/reportes"
          element={
            <ProtectedByPermission
              resource={FEATURES.REPORTES}
              action="view"
              redirectTo="/perfil"
            >
              <Reportes />
            </ProtectedByPermission>
          }
        />
        <Route
          path="/notificaciones"
          element={
            <ProtectedByPermission
              resource={FEATURES.NOTIFICACIONES}
              action="view"
              redirectTo="/perfil"
            >
              <Notificaciones />
            </ProtectedByPermission>
          }
        />
        <Route
          path="/configuracion/invitaciones"
          element={
            <ProtectedByPermission
              resource={FEATURES.EMPLEADOS}
              action="create"
              redirectTo="/perfil"
            >
              <InvitacionesConfig />
            </ProtectedByPermission>
          }
        />
        <Route
          path="/Configuración/invitaciones"
          element={
            <ProtectedByPermission
              resource={FEATURES.EMPLEADOS}
              action="create"
              redirectTo="/perfil"
            >
              <InvitacionesConfig />
            </ProtectedByPermission>
          }
        />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/set-password" element={<SetPassword />} />
    </Routes>
  );
}
