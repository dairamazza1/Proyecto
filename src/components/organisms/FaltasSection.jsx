import { useState } from "react";
import styled from "styled-components";
import {
  Btn1,
  ModalFaltasForm,
  TablaFaltas,
  getFaltasByEmpleadoId,
  deleteEmpleadoFalta,
  updateEmpleadoFalta,
  Spinner1,
} from "../../index";
import { usePermissions } from "../../hooks/usePermissions";
import { FEATURES } from "../../utils/features";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v } from "../../styles/variables";
import Swal from "sweetalert2";

export function FaltasSection({
  empleadoId,
  title = "Faltas",
  embedded = false,
}) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedFalta, setSelectedFalta] = useState(null);
  const queryClient = useQueryClient();

  // Hook de permisos
  const { canCreate, canValidate, canDelete, profile } = usePermissions();

  const { data, isLoading, error } = useQuery({
    queryKey: ["faltas", empleadoId],
    queryFn: () => getFaltasByEmpleadoId(empleadoId),
    enabled: !!empleadoId,
    refetchOnWindowFocus: false,
  });

  const handleNuevo = () => {
    setSelectedFalta(null);
    setOpenModal(true);
  };

  const handleEditar = (falta) => {
    setSelectedFalta(falta);
    setOpenModal(true);
  };

  const { mutate: doEliminar } = useMutation({
    mutationFn: deleteEmpleadoFalta,
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al eliminar falta.",
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Falta eliminada",
        text: "Se elimino la falta.",
      });
      queryClient.invalidateQueries({ queryKey: ["faltas", empleadoId] });
    },
  });

  const { mutate: doActualizarEstado } = useMutation({
    mutationFn: async ({ id, status }) => {
      const payload = { status };
      if (profile?.id) {
        payload.verified_by = profile.id;
        payload.verified_at = new Date().toISOString();
      }
      return updateEmpleadoFalta(id, payload);
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
        variables?.status === "approved" ? "aprobada" : "rechazada";
      Swal.fire({
        icon: "success",
        title: "Estado actualizado",
        text: `La falta fue ${statusLabel}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["faltas", empleadoId] });
    },
  });

  const handleEliminar = (falta) => {
    if (!canDelete(FEATURES.FALTAS)) return;
    Swal.fire({
      title: "Estas seguro(a)?",
      text: "Una vez eliminado, no podras recuperar este registro.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, eliminar",
    }).then((result) => {
      if (result.isConfirmed) {
        doEliminar(falta.id);
      }
    });
  };

  const handleActualizarEstado = (falta, status) => {
    if (!canValidate(FEATURES.FALTAS)) return;
    const actionLabel = status === "approved" ? "Aprobar" : "Rechazar";
    Swal.fire({
      title: `${actionLabel} falta`,
      text: "Confirma la accion para actualizar el estado.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: v.colorPrincipal,
      cancelButtonColor: v.rojo,
      confirmButtonText: actionLabel,
    }).then((result) => {
      if (result.isConfirmed) {
        doActualizarEstado({ id: falta.id, status });
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
        {canCreate(FEATURES.FALTAS) && (
          <Btn1
            icono={<v.iconoagregar />}
            titulo="nuevo"
            bgcolor={v.colorPrincipal}
            funcion={handleNuevo}
          />
        )}
      </div>

      {data?.length ? (
        <TablaFaltas
          data={data}
          onEdit={handleEditar}
          onDelete={handleEliminar}
          onApprove={(falta) => handleActualizarEstado(falta, "approved")}
          onReject={(falta) => handleActualizarEstado(falta, "rejected")}
        />
      ) : (
        <EmptyState>Sin registros por el momento.</EmptyState>
      )}

      {openModal && (
        <ModalFaltasForm
          empleadoId={empleadoId}
          falta={selectedFalta}
          onClose={() => setOpenModal(false)}
        />
      )}
    </Section>
  );
}

const Section = styled.section`
  background: ${({ theme }) => theme.bg};
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
