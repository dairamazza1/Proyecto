import { Routes, Route } from "react-router-dom";
import {
  Categories,
  Configurations,
  Empleado,
  Empleados,
  Home,
  Login,
  Perfil,
  Reportes,
  Register,
  ProtectedRoute,
  RegistrarEmpleados,
  Spinner1,
  UserAuth,
  useUsersStore,
} from "../index";
import { useQuery } from "@tanstack/react-query";

export function MyRoutes() {
  const { user } = UserAuth();
  const { showUsers } = useUsersStore();

  const { isLoading, error } = useQuery({
    queryKey: ["mostrar usuarios"],
    queryFn: showUsers,refetchOnWindowFocus:false
  });

  if (isLoading) {
    return <Spinner1 />;
  }
  if (error) {
    return <span>error...</span>;
  }

  return (
    <Routes>
      //Rutas protegidas
      <Route element={<ProtectedRoute user={user} redirectTo="/login" />}>
        <Route path="/" element={<Home />} />
        <Route path="/empleados" element={<Empleados />} />
        <Route path="/empleados/nuevo" element={<RegistrarEmpleados />} />
        <Route path="/empleados/:id" element={<Empleado />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/configuracion" element={<Configurations />} />
        <Route path="/configuracion/categorias" element={<Categories />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}
