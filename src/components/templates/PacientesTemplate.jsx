import styled from "styled-components";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  Btn1,
  fetchCurrentUserAuditorFinanciadorId,
  ModalPacienteIngresoForm,
  Spinner1,
  TablaPacientesHistorial,
  Title,
  UserAuth,
  getCurrentUserSucursalId,
  useCompanyStore,
  usePersistedSucursalSelection,
  usePermissions,
  useSucursalesStore,
} from "../../index";
import {
  getPacientesHistorial,
} from "../../supabase/crudPacientes";
import { v } from "../../styles/variables";
import { DeviceMax } from "../../styles/breakpoints";
import {
  PACIENTE_CONDITION_TABS,
  PACIENTE_DEFAULT_EPISODE_FILTER_BY_CONDITION,
  formatPacienteConditionType,
} from "../../utils/pacienteCondition";

const HISTORY_EPISODE_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "admitted", label: "Internados" },
  { id: "discharged", label: "Egresados" },
];

export function PacientesTemplate() {
  const [activeTab, setActiveTab] = useState("agudo");
  const [search, setSearch] = useState("");
  const [openIngresoModal, setOpenIngresoModal] = useState(false);
  const [historyEpisodeFilter, setHistoryEpisodeFilter] = useState(
    PACIENTE_DEFAULT_EPISODE_FILTER_BY_CONDITION.agudo
  );

  const { canCreate, isAdmin, isAuditor } = usePermissions();
  const { user } = UserAuth();
  const { dataCompany, showCompany } = useCompanyStore();
  const { showSucursales, dataSucursales } = useSucursalesStore();
  const canSelectSucursal = isAdmin();
  const isAuditorRole = isAuditor();

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

  const {
    data: auditorFinanciadorId = null,
    isLoading: loadingAuditorFinanciador,
    error: auditorFinanciadorError,
  } = useQuery({
    queryKey: ["currentUserAuditorFinanciadorId"],
    queryFn: fetchCurrentUserAuditorFinanciadorId,
    enabled: isAuditorRole,
    refetchOnWindowFocus: false,
  });

  const [selectedSucursalId, setSelectedSucursalId] =
    usePersistedSucursalSelection({
      userId: user?.id,
      empresaId,
      sucursales: dataSucursales,
      enabled: canSelectSucursal,
      fallbackSucursalId: autoSucursalId,
    });

  const resolvedSucursalId = canSelectSucursal
    ? selectedSucursalId
    : autoSucursalId;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setHistoryEpisodeFilter(
      PACIENTE_DEFAULT_EPISODE_FILTER_BY_CONDITION[tabId] ?? "all"
    );
  };

  const {
    data: pacientes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "pacientesHistorial",
      empresaId,
      resolvedSucursalId,
      activeTab,
      search,
      historyEpisodeFilter,
      auditorFinanciadorId,
    ],
    queryFn: () =>
      getPacientesHistorial({
        empresaId,
        sucursalId: resolvedSucursalId,
        financiadorId: isAuditorRole ? auditorFinanciadorId : null,
        search,
        episodeStatus: historyEpisodeFilter,
        conditionType: activeTab,
      }),
    enabled: Boolean(
      empresaId &&
        resolvedSucursalId &&
        (!isAuditorRole || auditorFinanciadorId)
    ),
    refetchOnWindowFocus: false,
  });

  const showEmptyState =
    (isAuditorRole && !auditorFinanciadorId) ||
    (canSelectSucursal && !resolvedSucursalId) ||
    (!canSelectSucursal && !resolvedSucursalId && !loadingSucursal);
  const subtitle = `${formatPacienteConditionType(
    activeTab
  )} por ultimo episodio en la sucursal seleccionada`;
  const emptyMessage =
    "Sin pacientes para la condicion y filtros seleccionados.";

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

  if (!canSelectSucursal && (loadingSucursal || (isAuditorRole && loadingAuditorFinanciador))) {
    return <Spinner1 />;
  }

  if (!canSelectSucursal && sucursalError) {
    return <span>ha ocurrido un error: {sucursalError.message}</span>;
  }

  if (isAuditorRole && auditorFinanciadorError) {
    return <span>ha ocurrido un error: {auditorFinanciadorError.message}</span>;
  }

  return (
    <Container>
      <Header>
        <div className="titleGroup">
          <Title>Pacientes</Title>
          <p>{subtitle}</p>
        </div>
      </Header>

      <TabsRow>
        {PACIENTE_CONDITION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </TabsRow>

      <ControlsCard>
        <div className="searchBlock">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por DNI, nombre o apellido"
          />
        </div>

        <div className="actions">
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
      </ControlsCard>

      <HistoryFiltersCard>
        <span className="filterLabel">Estado de internacion</span>
        <div
          className="filterOptions"
          role="tablist"
          aria-label="Filtrar pacientes por estado de internacion"
        >
          {HISTORY_EPISODE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={historyEpisodeFilter === filter.id ? "active" : ""}
              onClick={() => setHistoryEpisodeFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </HistoryFiltersCard>

      <ResultsCard>
        {showEmptyState ? (
          <EmptyState>
            {isAuditorRole && !auditorFinanciadorId
              ? "No hay financiador asociado al auditor."
              : canSelectSucursal
                ? "Selecciona una sucursal para ver los pacientes."
                : "No se pudo determinar la sucursal asignada."}
          </EmptyState>
        ) : isLoading ? (
          <Spinner1 />
        ) : error ? (
          <span>ha ocurrido un error: {error.message}</span>
        ) : pacientes.length ? (
          <TablaPacientesHistorial
            data={pacientes}
            episodeStatusFilter={historyEpisodeFilter}
          />
        ) : (
          <EmptyState>{emptyMessage}</EmptyState>
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

  .titleGroup {
    display: grid;
    gap: 8px;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.textsecundary};
    font-weight: 500;
  }
`;

const TabsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;

  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 0 12px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    height: 40px;
    min-height: 40px;
    line-height: 1;
    font-size: 0.95rem;
  }

  .tab.active {
    border-color: ${({ theme }) => theme.color1};
    color: ${({ theme }) => theme.color1};
    background: var(--bg-accent-soft);
  }

  @media ${DeviceMax.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ControlsCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 14px 16px;
  box-shadow: var(--shadow-elev-1);
  display: grid;
  grid-template-columns: minmax(240px, 1.4fr) minmax(0, 1fr);
  gap: 12px 16px;
  align-items: center;

  .searchBlock {
    min-width: 0;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
  }

  input {
    border: 2px solid ${({ theme }) => theme.color2};
    border-radius: 10px;
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    padding: 10px 12px;
    min-width: 0;
    width: 100%;
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

  .select-sucursal option {
    color: ${({ theme }) => theme.text};
  }

  @media ${DeviceMax.tablet} {
    grid-template-columns: 1fr;

    .actions {
      justify-content: stretch;
    }
  }

  @media ${DeviceMax.mobile} {
    .actions {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr;
    }

    .selector-sucursal {
      width: 100%;
    }

    .select-sucursal {
      min-width: 0;
    }
  }
`;

const HistoryFiltersCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 14px 16px;
  box-shadow: var(--shadow-elev-1);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;

  .filterLabel {
    color: ${({ theme }) => theme.textsecundary};
    font-weight: 600;
  }

  .filterOptions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .filterOptions button {
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    border-radius: 999px;
    min-height: 36px;
    padding: 0 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .filterOptions button.active {
    border-color: ${({ theme }) => theme.color1};
    color: ${({ theme }) => theme.color1};
    background: var(--bg-accent-soft);
  }

  @media ${DeviceMax.mobile} {
    align-items: stretch;

    .filterLabel {
      width: 100%;
    }

    .filterOptions {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .filterOptions button {
      width: 100%;
      min-width: 0;
      padding: 0 8px;
      font-size: 0.82rem;
      white-space: nowrap;
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
