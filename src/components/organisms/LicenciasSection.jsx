import { useState } from "react";
import styled from "styled-components";
import {
  Btn1,
  ModalLicenciasForm,
  TablaLicencias,
  getLicenciasByEmpleadoId,
  Spinner1,
} from "../../index";
import { useQuery } from "@tanstack/react-query";
import { v } from "../../styles/variables";

export function LicenciasSection({ empleadoId }) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedLicencia, setSelectedLicencia] = useState(null);

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

  if (isLoading) {
    return <Spinner1 />;
  }

  if (error) {
    return <span>ha ocurrido un error: {error.message}</span>;
  }

  return (
    <Section>
      <div className="sectionHeader">
        <h3>Licencias</h3>
        <Btn1
          icono={<v.iconoagregar />}
          titulo="nuevo"
          bgcolor={v.colorPrincipal}
          funcion={handleNuevo}
        />
      </div>

      {data?.length ? (
        <TablaLicencias data={data} onEdit={handleEditar} />
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
