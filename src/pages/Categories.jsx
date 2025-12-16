//acá se muestran datos. El template es el que tiene la estructura de la página
import { useQuery } from "@tanstack/react-query";
import {
  CategoriesTemplate,
  useModulesStore,
  Spinner1,
  useCompanyStore,
} from "../index";

export function Categories() {
  const { showModules, searchModule, buscador  } = useModulesStore();
  const {isLoading, dataCompany } = useCompanyStore();
  const {} = useQuery({
    queryKey: ["mostrar categorias", dataCompany?.id],
    queryFn: () => showModules({ id_company: dataCompany?.id }),
    enabled: !!dataCompany,
    refetchOnWindowFocus: false,
  });

  console.log(useCompanyStore());

  //buscar categorias
  const {  } = useQuery({
    queryKey: ["buscar categorias", buscador],
    queryFn: () =>
      buscarCategorias({ id_company: dataCompany?.id, description: buscador }),
    enabled: !!dataCompany,
    refetchOnWindowFocus: false,
  });
  

    // if (isLoading) {
    //     return <Spinner1 />;
    //   }
    //   if (error) {
    //     return <span>ha ocurrido un error: {error.message}</span>;
    //   }

  return <CategoriesTemplate />;
}
