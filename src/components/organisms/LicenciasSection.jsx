import { useState } from "react";
import styled from "styled-components";
import {
  Btn1,
  ModalLicenciasForm,
  TablaLicencias,
  getLicenciasByEmpleadoId,
  deleteEmpleadoLicencia,
  Spinner1,
} from "../../index";
import { usePermissions } from "../../hooks/usePermissions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v } from "../../styles/variables";
import Swal from "sweetalert2";

export function LicenciasSection({ empleadoId, title = "Licencias" }) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedLicencia, setSelectedLicencia] = useState(null);
  const queryClient = useQueryClient();
  
  // Hook de permisos
  const { canCreate } = usePermissions();

  const { data, isLoading, error } = useQuery({
    queryKey: ["licencias", empleadoId],
    queryFn: () => getLicenciasByEmpleadoId(empleadoId),
    enabled: !!empleadoId,
    refetchOnWindowFocus: false,
  });

  const handleNuevo = () => {
    setSelectedLicencia(null);
    setOpenModal(true);
  };

  const handleEditar = (licencia) => {
    setSelectedLicencia(licencia);
    setOpenModal(true);
  };

  const { mutate: doEliminar } = useMutation({
    mutationFn: deleteEmpleadoLicencia,
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al eliminar licencia.",
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Licencia eliminada",
        text: "Se elimino la licencia.",
      });
      queryClient.invalidateQueries({ queryKey: ["licencias", empleadoId] });
    },
  });

  const handleEliminar = (licencia) => {
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
        doEliminar(licencia.id);
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
    <Section>
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
        <TablaLicencias
          data={data}
          onEdit={handleEditar}
          onDelete={handleEliminar}
        />
      ) : (
        <EmptyState>Sin registros por el momento.</EmptyState>
      )}

      {openModal && (
        <ModalLicenciasForm
          empleadoId={empleadoId}
          licencia={selectedLicencia}
          onClose={() => setOpenModal(false)}
        />
      )}
    </Section>
  );
}

const Section = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
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


