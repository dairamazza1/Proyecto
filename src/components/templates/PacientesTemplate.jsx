import styled from "styled-components";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Btn1,
  ModalPacienteIngresoForm,
  Spinner1,
  TablaPacientes,
  Title,
  UserAuth,
  useCompanyStore,
  usePermissions,
} from "../../index";
import { getPacientesActivos } from "../../supabase/crudPacientes";
import { v } from "../../styles/variables";
import { DeviceMax } from "../../styles/breakpoints";

export function PacientesTemplate() {
  const [search, setSearch] = useState("");
  const [openIngresoModal, setOpenIngresoModal] = useState(false);

  const { canCreate } = usePermissions();
  const { user } = UserAuth();
  const { dataCompany, showCompany } = useCompanyStore();

  useQuery({
    queryKey: ["empresa", user?.id],
    queryFn: () => showCompany({ id_auth: user?.id }),
    enabled: Boolean(user?.id),
    refetchOnWindowFocus: false,
  });

  const empresaId = dataCompany?.id ?? null;

  const {
    data: pacientes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pacientesActivos", empresaId, search],
    queryFn: () => getPacientesActivos({ empresaId, search }),
    enabled: Boolean(empresaId),
    refetchOnWindowFocus: false,
  });

  return (
    <Container>
      <Header>
        <div className="titleGroup">
          <Title>Pacientes</Title>
          <p>Pacientes internados</p>
        </div>
        <div className="actions">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar paciente"
          />
          {canCreate("pacientes") && (
            <Btn1
              icono={<v.iconoagregar />}
              titulo="Ingresar paciente"
              bgcolor={v.colorPrincipal}
              funcion={() => setOpenIngresoModal(true)}
            />
          )}
        </div>
      </Header>

      <ResultsCard>
        {isLoading ? (
          <Spinner1 />
        ) : error ? (
          <span>ha ocurrido un error: {error.message}</span>
        ) : pacientes.length ? (
          <TablaPacientes data={pacientes} />
        ) : (
          <EmptyState>Sin pacientes internados para los filtros seleccionados.</EmptyState>
        )}
      </ResultsCard>

      {openIngresoModal && (
        <ModalPacienteIngresoForm
          empresaId={empresaId}
          onClose={() => setOpenIngresoModal(false)}
        />
      )}
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  min-width: 0;
  min-height: calc(100dvh - 30px);
  padding: 20px 22px 28px;
  display: grid;
  gap: 16px;
  align-content: start;
  background: ${({ theme }) => theme.bgtotal};
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;

  .titleGroup {
    display: grid;
    gap: 8px;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.textsecundary};
    font-weight: 500;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: flex-end;
  }

  input {
    border: 2px solid ${({ theme }) => theme.color2};
    border-radius: 10px;
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    padding: 10px 12px;
    min-width: 200px;
    outline: none;
  }

  @media ${DeviceMax.mobile} {
    .actions {
      width: 100%;
    }
    input {
      width: 100%;
    }
  }
`;

const ResultsCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 18px 20px;
  box-shadow: var(--shadow-elev-1);
`;

const EmptyState = styled.div`
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.textsecundary};
  text-align: center;
`;
