//acá se muestran datos. El template es el que tiene la estructura de la página

import { useQuery } from "@tanstack/react-query";
import { ConfigurationTemplate, Spinner1, useModuleSectionStore } from "../index";

export function Configurations() {
  const { getModuleSection } = useModuleSectionStore();
  const { isLoading, error } = useQuery({
    queryKey: ['Mostar secciones de módulo'],
    queryFn:  getModuleSection,refetchOnWindowFocus:false
  });


  if (isLoading) {
    return <Spinner1 />;
  }
  if (error) {
    return <span>ha ocurrido un error: {error.message}</span>;
  }
  return <ConfigurationTemplate />;
}
