import { Routes, Route } from "react-router-dom";
import {
  Categories,
  Configurations,
  Home,
  Login,
  Register,
  ProtectedRoute,
  Spinner1,
  useCompanyStore,
  UserAuth,
  useUsersStore,
} from "../index";
import { useQuery } from "@tanstack/react-query";

export function MyRoutes() {
  const { user } = UserAuth();
  const { dataUsers, showUsers } = useUsersStore();
  const { dataCompany, showCompany } = useCompanyStore();

  const { isLoading, error } = useQuery({
    queryKey: ["mostrar usuarios"],
    queryFn: showUsers,refetchOnWindowFocus:false
  });

  const {data:dtCompany} = useQuery({
    queryKey: ["Mostrar empresa", dataUsers?.id],
    queryFn: () => showCompany({ _id_user: dataUsers?.id }), enabled:!!dataUsers,refetchOnWindowFocus:false
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
        <Route path="/configuracion" element={<Configurations />} />
        <Route path="/configuracion/categorias" element={<Categories />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}
