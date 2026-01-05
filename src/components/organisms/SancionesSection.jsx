import { useState } from "react";
import styled from "styled-components";
import {
  Btn1,
  ModalSancionesForm,
  TablaSanciones,
  getSancionesByEmpleadoId,
  deleteSancion,
  Spinner1,
} from "../../index";
import { usePermissions } from "../../hooks/usePermissions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v } from "../../styles/variables";
import Swal from "sweetalert2";

export function SancionesSection({
  empleadoId,
  title = "Sanciones",
  embedded = false,
}) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedSancion, setSelectedSancion] = useState(null);
  const queryClient = useQueryClient();
  
  // Hook de permisos
  const { canCreate } = usePermissions();

  const { data, isLoading, error } = useQuery({
    queryKey: ["sanciones", empleadoId],
    queryFn: () => getSancionesByEmpleadoId(empleadoId),
    enabled: !!empleadoId,
    refetchOnWindowFocus: false,
  });

  const handleNuevo = () => {
    setSelectedSancion(null);
    setOpenModal(true);
  };

  const handleEditar = (sancion) => {
    setSelectedSancion(sancion);
    setOpenModal(true);
  };

  const { mutate: doEliminar } = useMutation({
    mutationFn: deleteSancion,
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al eliminar sancion.",
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Sancion eliminada",
        text: "Se elimino la sancion.",
      });
      queryClient.invalidateQueries({ queryKey: ["sanciones", empleadoId] });
    },
  });

  const handleEliminar = (sancion) => {
    Swal.fire({
      title: "ÂEstas seguro(a)?",
      text: "Una vez eliminado, no podras recuperar este registro.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, eliminar",
    }).then((result) => {
      if (result.isConfirmed) {
        doEliminar(sancion.id);
      }
    });
  };

  if (isLoading) {
    return <Spinner1 />;
  }

  if (error) {
    return <span>ha ocurrido un error: {error.message}</span>;
  }

  return (
    <Section $embedded={embedded}>
      <div className="sectionHeader">
        <h3>{title}</h3>
        <Btn1
          icono={<v.iconoagregar />}
          titulo="nuevo"
          bgcolor={v.colorPrincipal}
          funcion={handleNuevo}
        />
      </div>

      {data?.length ? (
        <TablaSanciones
          data={data}
          onEdit={handleEditar}
          onDelete={handleEliminar}
        />
      ) : (
        <EmptyState>Sin registros por el momento.</EmptyState>
      )}

      {openModal && (
        <ModalSancionesForm
          empleadoId={empleadoId}
          sancion={selectedSancion}
          onClose={() => setOpenModal(false)}
        />
      )}
    </Section>
  );
}

const Section = styled.section`
  background: ${({ theme, $embedded }) => ($embedded ? "transparent" : theme.bg)};
  border-radius: ${({ $embedded }) => ($embedded ? "0" : "18px")};
  padding: ${({ $embedded }) => ($embedded ? "0" : "20px 24px")};
  box-shadow: ${({ $embedded }) =>
    $embedded ? "none" : "0 6px 18px rgba(0, 0, 0, 0.08)"};
  display: grid;
  gap: 14px;

  .sectionHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
`;

const EmptyState = styled.div`
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.textsecundary};
  text-align: center;
`;


