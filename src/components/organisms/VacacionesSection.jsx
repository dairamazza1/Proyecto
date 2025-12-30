import { useMemo, useState } from "react";
import styled from "styled-components";
import {
  Btn1,
  ModalVacacionesForm,
  TablaVacaciones,
  getVacacionesByEmpleadoId,
  Spinner1,
} from "../../index";
import { useQuery } from "@tanstack/react-query";
import { v } from "../../styles/variables";
import { calcVacationSummary } from "../../utils/vacaciones";


export function VacacionesSection({ empleado, empleadoId }) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedVacacion, setSelectedVacacion] = useState(null);

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

  if (isLoading) {
    return <Spinner1 />;
  }

  if (error) {
    return <span>ha ocurrido un error: {error.message}</span>;
  }

  return (
    <Section>
      <div className="sectionHeader">
        <h3>Vacaciones</h3>
        <Btn1
          icono={<v.iconoagregar />}
          titulo="nuevo"
          bgcolor={v.colorPrincipal}
          funcion={handleNuevo}
        />
      </div>

      <div className="sectionMeta">
        <span>Anuales: {summary.annualDays} dias</span>
        <span>Aprobados: {summary.taken}</span>
        <span>Pendientes: {summary.pending}</span>
        <span>Ultimo periodo: {summary.periodYear}</span>
      </div>

      {data?.length ? (
        <TablaVacaciones data={data} onEdit={handleEditar} />
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
