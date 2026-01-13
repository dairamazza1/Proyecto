import { useMemo, useState } from "react";
import styled from "styled-components";
import {
  Btn1,
  ModalVacacionesForm,
  TablaVacaciones,
  getVacacionesByEmpleadoId,
  deleteVacacion,
  Spinner1,
} from "../../index";
import { usePermissions } from "../../hooks/usePermissions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v } from "../../styles/variables";
import { calcVacationSummary } from "../../utils/vacaciones";
import Swal from "sweetalert2";


export function VacacionesSection({
  empleado,
  empleadoId,
  title = "Vacaciones",
  embedded = false,
}) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedVacacion, setSelectedVacacion] = useState(null);
  const queryClient = useQueryClient();
  
  // Hook de permisos
  const { canCreate } = usePermissions();

  const { data, isLoading, error } = useQuery({
    queryKey: ["vacaciones", empleadoId],
    queryFn: () => getVacacionesByEmpleadoId(empleadoId),
    enabled: !!empleadoId,
    refetchOnWindowFocus: false,
  });

  const summary = useMemo(
    () => calcVacationSummary(empleado, data),
    [empleado, data]
  );

  const handleNuevo = () => {
    setSelectedVacacion(null);
    setOpenModal(true);
  };

  const handleEditar = (vacacion) => {
    setSelectedVacacion(vacacion);
    setOpenModal(true);
  };

  const { mutate: doEliminar } = useMutation({
    mutationFn: deleteVacacion,
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al eliminar vacaciones.",
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Vacaciones eliminadas",
        text: "Se eliminaron las vacaciones.",
      });
      queryClient.invalidateQueries({ queryKey: ["vacaciones", empleadoId] });
    },
  });

  const handleEliminar = (vacacion) => {
    Swal.fire({
      title: "ÂEstas seguro(a)?",
      text: "Una vez eliminado, no podras recuperar este registro.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: v.colorPrincipal,
      cancelButtonColor: v.rojo,
      confirmButtonText: "Si, eliminar",
    }).then((result) => {
      if (result.isConfirmed) {
        doEliminar(vacacion.id);
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
        {canCreate("vacaciones") && (
          <Btn1
            icono={<v.iconoagregar />}
            titulo="nuevo"
            bgcolor={v.colorPrincipal}
            funcion={handleNuevo}
          />
        )}
      </div>

      <div className="sectionMeta">
        <span>Anuales: {summary.annualDays} dias</span>
        <span>Aprobados: {summary.taken}</span>
        <span>Pendientes: {summary.pending}</span>
        <span>Ultimo periodo: {summary.periodYear}</span>
      </div>

      {data?.length ? (
        <TablaVacaciones
          data={data}
          onEdit={handleEditar}
          onDelete={handleEliminar}
        />
      ) : (
        <EmptyState>Sin registros por el momento.</EmptyState>
      )}

      {openModal && (
        <ModalVacacionesForm
          empleadoId={empleadoId}
          vacacion={selectedVacacion}
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

  .sectionMeta {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    color: ${({ theme }) => theme.textsecundary};
    font-weight: 500;
  }
`;

const EmptyState = styled.div`
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.textsecundary};
  text-align: center;
`;


