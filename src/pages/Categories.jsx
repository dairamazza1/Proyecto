//acá se muestran datos. El template es el que tiene la estructura de la página
import { useQuery } from "@tanstack/react-query";
import {
  CategoriesTemplate,
  useModulesStore,
  Spinner1,
  useCompanyStore,
} from "../index";

export function Categories() {
  const { showModules } = useModulesStore();
  const { dataCompany } = useCompanyStore();
  const {} = useQuery({
    queryKey: ["mostrar categorias", dataCompany?.id],
    queryFn: () => showModules({ id_company: dataCompany?.id }),
  });

  //   if (isLoading) {
  //       return <Spinner1 />;
  //     }
  //     if (error) {
  //       return <span>ha ocurrido un error: {error.message}</span>;
  //     }

  return <CategoriesTemplate />;
}
