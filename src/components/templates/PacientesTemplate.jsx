import styled from "styled-components";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  Btn1,
  ModalPacienteIngresoForm,
  Spinner1,
  TablaPacientes,
  Title,
  UserAuth,
  getCurrentUserSucursalId,
  useCompanyStore,
  usePermissions,
  useSucursalesStore,
} from "../../index";
import { getPacientesActivos } from "../../supabase/crudPacientes";
import { v } from "../../styles/variables";
import { DeviceMax } from "../../styles/breakpoints";

export function PacientesTemplate() {
  const [search, setSearch] = useState("");
  const [openIngresoModal, setOpenIngresoModal] = useState(false);
  const [selectedSucursalId, setSelectedSucursalId] = useState(null);

  const { canCreate, isAdmin, isRRHH } = usePermissions();
  const { user } = UserAuth();
  const { dataCompany, showCompany } = useCompanyStore();
  const { showSucursales, dataSucursales } = useSucursalesStore();
  const canSelectSucursal = isAdmin() || isRRHH();

  useQuery({
    queryKey: ["empresa", user?.id],
    queryFn: () => showCompany({ id_auth: user?.id }),
    enabled: Boolean(user?.id),
    refetchOnWindowFocus: false,
  });

  const empresaId = dataCompany?.id ?? null;

  useQuery({
    queryKey: ["sucursales", empresaId],
    queryFn: () => showSucursales({ empresa_id: empresaId }),
    enabled: canSelectSucursal && Boolean(empresaId),
    refetchOnWindowFocus: false,
  });

  const {
    data: autoSucursalId,
    isLoading: loadingSucursal,
    error: sucursalError,
  } = useQuery({
    queryKey: ["currentSucursalIdPacientes"],
    queryFn: getCurrentUserSucursalId,
    enabled: Boolean(user?.id),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!canSelectSucursal) return;
    if (selectedSucursalId !== null && selectedSucursalId !== undefined) return;
    if (!autoSucursalId) return;
    setSelectedSucursalId(Number(autoSucursalId));
  }, [autoSucursalId, canSelectSucursal, selectedSucursalId]);

  const resolvedSucursalId = canSelectSucursal
    ? selectedSucursalId
    : autoSucursalId;

  const {
    data: pacientes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pacientesActivos", empresaId, resolvedSucursalId, search],
    queryFn: () =>
      getPacientesActivos({
        empresaId,
        sucursalId: resolvedSucursalId,
        search,
      }),
    enabled: Boolean(empresaId && resolvedSucursalId),
    refetchOnWindowFocus: false,
  });

  const showEmptyState =
    (canSelectSucursal && !resolvedSucursalId) ||
    (!canSelectSucursal && !resolvedSucursalId && !loadingSucursal);

  const handleOpenIngreso = () => {
    if (canSelectSucursal && !resolvedSucursalId) {
      Swal.fire({
        icon: "info",
        title: "Selecciona una sucursal",
        text: "Debes elegir una sucursal para registrar un paciente.",
      });
      return;
    }

    if (!canSelectSucursal && !resolvedSucursalId) {
      Swal.fire({
        icon: "warning",
        title: "Sucursal no disponible",
        text: "No se pudo determinar la sucursal asignada.",
      });
      return;
    }

    setOpenIngresoModal(true);
  };

  if (!canSelectSucursal && loadingSucursal) {
    return <Spinner1 />;
  }

  if (!canSelectSucursal && sucursalError) {
    return <span>ha ocurrido un error: {sucursalError.message}</span>;
  }

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
          {canSelectSucursal && (
            <div className="selector-sucursal">
              <select
                value={resolvedSucursalId ?? ""}
                onChange={(event) =>
                  setSelectedSucursalId(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                className={`select-sucursal${
                  resolvedSucursalId == null ? " is-empty" : ""
                }`}
              >
                <option value="">Seleccione una sucursal</option>
                {dataSucursales?.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {canCreate("pacientes") && (
            <Btn1
              icono={<v.iconoagregar />}
              titulo="Ingresar paciente"
              bgcolor={v.colorPrincipal}
              funcion={handleOpenIngreso}
            />
          )}
        </div>
      </Header>

      <ResultsCard>
        {showEmptyState ? (
          <EmptyState>
            {canSelectSucursal
              ? "Selecciona una sucursal para ver los pacientes internados."
              : "No se pudo determinar la sucursal asignada."}
          </EmptyState>
        ) : isLoading ? (
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
          sucursalId={resolvedSucursalId}
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

  .selector-sucursal {
    width: min(260px, 100%);
  }

  .select-sucursal {
    width: 100%;
    min-width: 220px;
    height: 52px;
    padding: 0 15px;
    border-radius: 10px;
    border: 2px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 16px;
    cursor: pointer;
    outline: none;

    &:focus {
      border-color: ${({ theme }) => theme.color1};
    }
  }

  .select-sucursal.is-empty {
    color: var(--color-danger);
  }

  @media ${DeviceMax.mobile} {
    .actions {
      width: 100%;
    }
    input {
      width: 100%;
    }
    .selector-sucursal {
      width: 100%;
    }
    .select-sucursal {
      min-width: 0;
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
