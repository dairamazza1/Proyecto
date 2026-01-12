import { Routes, Route } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  // Categories,
  Configurations,
  Empleado,
  Empleados,
  Home,
  Login,
  Perfil,
  Reportes,
  Register,
  SetPassword,
  ProtectedRoute,
  RegistrarEmpleados,
  Spinner1,
  useUsersStore,
} from "../index";

export function MyRoutes() {
  const { showUsers } = useUsersStore();
  const { isLoading, error } = useQuery({
    queryKey: ["mostrar usuarios"],
    queryFn: showUsers, refetchOnWindowFocus: false
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
        <Route path="/empleados" element={<Empleados />} />
        <Route path="/empleados/nuevo" element={<RegistrarEmpleados />} />
        <Route path="/empleados/:id" element={<Empleado />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/configuracion" element={<Configurations />} />
        {/* <Route path="/configuracion/categorias" element={<Categories />} /> */}
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/set-password" element={<SetPassword />} />
    </Routes>
  );
}
