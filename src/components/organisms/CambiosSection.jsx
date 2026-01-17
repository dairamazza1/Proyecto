import { useState } from "react";
import styled from "styled-components";
import {
  Btn1,
  ModalCambiosForm,
  TablaCambios,
  getCambiosByEmpleadoId,
  deleteCambio,
  updateCambio,
  Spinner1,
  useCompanyStore,
} from "../../index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "../../hooks/usePermissions";
import { v } from "../../styles/variables";
import Swal from "sweetalert2";

export function CambiosSection({
  empleadoId,
  title = "Cambios de turnos",
  embedded = false,
}) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedCambio, setSelectedCambio] = useState(null);
  const { dataCompany } = useCompanyStore();
  const queryClient = useQueryClient();
  const { canUpdate, profile } = usePermissions();
  
  
  const empresaNombre =
    dataCompany?.name ||
    dataCompany?.business_name ||
    dataCompany?.razon_social ||
    dataCompany?.nombre ||
    "Empresa";

  const { data, isLoading, error } = useQuery({
    queryKey: ["cambios", empleadoId],
    queryFn: () => getCambiosByEmpleadoId(empleadoId),
    enabled: !!empleadoId,
    refetchOnWindowFocus: false,
  });

  const handleNuevo = () => {
    setSelectedCambio(null);
    setOpenModal(true);
  };

  const handleEditar = (cambio) => {
    setSelectedCambio(cambio);
    setOpenModal(true);
  };

  const { mutate: doEliminar } = useMutation({
    mutationFn: deleteCambio,
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al eliminar cambio.",
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Cambio eliminado",
        text: "Se elimino el cambio.",
      });
      queryClient.invalidateQueries({ queryKey: ["cambios", empleadoId] });
    },
  });

  const { mutate: doActualizarEstado } = useMutation({
    mutationFn: async ({ id, status }) => {
      const payload = { status };
      if (profile?.id) {
        payload.verified_by = profile.id;
        payload.verified_at = new Date().toISOString();
      }
      return updateCambio(id, payload);
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al actualizar estado.",
      });
    },
    onSuccess: (_data, variables) => {
      const statusLabel =
        variables?.status === "approved" ? "aprobado" : "rechazado";
      Swal.fire({
        icon: "success",
        title: "Estado actualizado",
        text: `El cambio fue ${statusLabel}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["cambios", empleadoId] });
    },
  });

  const handleEliminar = (cambio) => {
    Swal.fire({
      title: "Estas seguro(a)?",
      text: "Una vez eliminado, no podras recuperar este registro.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: v.colorPrincipal,
      cancelButtonColor: v.rojo,
      confirmButtonText: "Si, eliminar",
    }).then((result) => {
      if (result.isConfirmed) {
        doEliminar(cambio.id);
      }
    });
  };

  const handleActualizarEstado = (cambio, status) => {
    if (!canUpdate("cambios")) return;
    const actionLabel = status === "approved" ? "Aprobar" : "Rechazar";
    Swal.fire({
      title: `${actionLabel} cambio`,
      text: "Confirma la accion para actualizar el estado.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: v.colorPrincipal,
      cancelButtonColor: v.rojo,
      confirmButtonText: actionLabel,
    }).then((result) => {
      if (result.isConfirmed) {
        doActualizarEstado({ id: cambio.id, status });
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
        <TablaCambios
          data={data}
          onEdit={handleEditar}
          onDelete={handleEliminar}
          onApprove={(cambio) => handleActualizarEstado(cambio, "approved")}
          onReject={(cambio) => handleActualizarEstado(cambio, "rejected")}
          empresaNombre={empresaNombre}
        />
      ) : (
        <EmptyState>Sin registros por el momento.</EmptyState>
      )}

      {openModal && (
        <ModalCambiosForm
          empleadoId={empleadoId}
          cambio={selectedCambio}
          onClose={() => setOpenModal(false)}
        />
      )}
    </Section>
  );
}

const Section = styled.section`
  background: ${({ theme}) => (theme.bg)};
  border-radius: ${({ $embedded }) => ($embedded ? "0" : "18px")};
  padding: ${({ $embedded }) => ($embedded ? "0" : "20px 24px")};
  box-shadow: ${({ $embedded }) =>
    $embedded ? "none" : "var(--shadow-elev-1)"};
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


