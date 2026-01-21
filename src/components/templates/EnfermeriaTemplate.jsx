import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import {
  Btn1,
  ModalEnfermeriaForm,
  Spinner1,
  TablaEnfermeria,
  Title,
  UserAuth,
  getCurrentUserSucursalId,
  getEnfermeriaRecords,
  useCompanyStore,
  usePermissions,
  useSucursalesStore,
} from "../../index";
import { v } from "../../styles/variables";
import { Device, DeviceMax } from "../../styles/breakpoints";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";

const ALLOWED_TABS = new Set(["manana", "tarde", "noche"]);

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftDateBy = (baseDate, days) => {
  const [year, month, day] = String(baseDate).split("-").map(Number);
  if (!year || !month || !day) return baseDate;
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return baseDate;
  parsed.setDate(parsed.getDate() + days);
  const nextYear = parsed.getFullYear();
  const nextMonth = String(parsed.getMonth() + 1).padStart(2, "0");
  const nextDay = String(parsed.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

export function EnfermeriaTemplate() {
  const { user } = UserAuth();
  const { dataCompany, showCompany } = useCompanyStore();
  const { showSucursales, dataSucursales } = useSucursalesStore();
  const {
    isAdmin,
    isNurseEmployee,
    empleado,
    profile,
    defaultTabFromShift,
  } = usePermissions();

  const isAdminRole = isAdmin();
  const isNurse = isNurseEmployee();

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("manana");
  const [selectedDate, setSelectedDate] = useState(getTodayDate);
  const [selectedSucursalId, setSelectedSucursalId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const todayDate = getTodayDate();
  const isNextDisabled = selectedDate >= todayDate;

  useQuery({
    queryKey: ["empresa", user?.id],
    queryFn: () => showCompany({ id_auth: user?.id }),
    enabled: Boolean(user?.id) && !dataCompany?.id,
    refetchOnWindowFocus: false,
  });

  useQuery({
    queryKey: ["sucursales", dataCompany?.id],
    queryFn: () => showSucursales({ empresa_id: dataCompany?.id }),
    enabled: isAdminRole && Boolean(dataCompany?.id),
    refetchOnWindowFocus: false,
  });

  const {
    data: autoSucursalId,
    isLoading: loadingSucursal,
    error: sucursalError,
  } = useQuery({
    queryKey: ["currentSucursalId"],
    queryFn: getCurrentUserSucursalId,
    enabled: isNurse,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const tabParam = String(searchParams.get("tab") ?? "").toLowerCase();
    const fallback = isNurse
      ? defaultTabFromShift(empleado?.shift)
      : "manana";
    const nextTab = ALLOWED_TABS.has(tabParam) ? tabParam : fallback;
    setActiveTab(nextTab);
  }, [searchParams, isNurse, empleado?.shift, defaultTabFromShift]);

  const resolvedSucursalId = isAdminRole ? selectedSucursalId : autoSucursalId;

  const recordsQueryKey = useMemo(
    () => [
      "enfermeriaRecords",
      {
        sucursalId: resolvedSucursalId,
        date: selectedDate,
        shift: activeTab,
      },
    ],
    [resolvedSucursalId, selectedDate, activeTab]
  );

  const {
    data: records = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: recordsQueryKey,
    queryFn: () =>
      getEnfermeriaRecords({
        sucursalId: resolvedSucursalId,
        date: selectedDate,
        shift: activeTab,
      }),
    enabled: Boolean(resolvedSucursalId && selectedDate && activeTab),
    refetchOnWindowFocus: false,
  });

  const responsableName = useMemo(() => {
    const fullName = `${empleado?.first_name ?? ""} ${
      empleado?.last_name ?? ""
    }`.trim();
    if (fullName) return fullName;
    return profile?.email || user?.email || "Usuario";
  }, [empleado, profile, user]);

  const handleTabChange = (nextTab) => {
    if (!ALLOWED_TABS.has(nextTab)) return;
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams);
    params.set("tab", nextTab);
    setSearchParams(params, { replace: true });
  };

  const handleDateChange = (event) => {
    if (!event.target.value) return;
    setSelectedDate(event.target.value);
  };

  const handleAdd = () => {
    if (isAdminRole && !selectedSucursalId) {
      Swal.fire({
        icon: "info",
        title: "Selecciona una sucursal",
        text: "Debes elegir una sucursal para registrar.",
      });
      return;
    }

    if (isNurse) {
      const turno = empleado?.shift;
      if (!turno) {
        Swal.fire({
          icon: "warning",
          title: "Turno no asignado",
          text: "Tu turno no esta definido. Contacta a RRHH.",
        });
        return;
      }
      if (defaultTabFromShift(turno) !== activeTab) {
        Swal.fire({
          icon: "warning",
          title: "Turno incorrecto",
          text: "Solo puedes registrar en tu turno asignado.",
        });
        return;
      }
    }

    setSelectedRecord(null);
    setOpenModal(true);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setOpenModal(true);
  };

  const showEmptyState =
    (isAdminRole && !selectedSucursalId) ||
    (isNurse && !resolvedSucursalId && !loadingSucursal);

  if (loadingSucursal) {
    return <Spinner1 />;
  }

  if (sucursalError) {
    return <span>ha ocurrido un error: {sucursalError.message}</span>;
  }

  return (
    <Container>
      <Header>
        <div className="titleGroup">
          <Title>Enfermeria</Title>
          <p>Registros diarios por turno.</p>
        </div>
        {isAdminRole && (
          <div className="selector-sucursal">
            <select
              value={selectedSucursalId ?? ""}
              onChange={(e) =>
                setSelectedSucursalId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="select-sucursal"
            >
              <option value="">Seleccionar sucursal</option>
              {dataSucursales?.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </Header>

      <Controls>
        <div className="dateFilter">
          <button
            type="button"
            onClick={() => setSelectedDate(shiftDateBy(selectedDate, -1))}
            aria-label="Dia anterior"
          >
            <v.iconoflechaizquierda />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            max={todayDate}
          />
          <button
            type="button"
            onClick={() => setSelectedDate(shiftDateBy(selectedDate, 1))}
            aria-label="Dia siguiente"
            disabled={isNextDisabled}
          >
            <v.iconoflechaderecha />
          </button>
        </div>
        <Btn1
          icono={<v.iconoagregar />}
          titulo="Agregar registro"
          bgcolor={v.colorPrincipal}
          funcion={handleAdd}
          tipo="button"
        />
      </Controls>

      <Tabs>
        <button
          className={`tab ${activeTab === "manana" ? "active" : ""}`}
          type="button"
          onClick={() => handleTabChange("manana")}
        >
          Turno mañana
        </button>
        <button
          className={`tab ${activeTab === "tarde" ? "active" : ""}`}
          type="button"
          onClick={() => handleTabChange("tarde")}
        >
          Turno tarde
        </button>
        <button
          className={`tab ${activeTab === "noche" ? "active" : ""}`}
          type="button"
          onClick={() => handleTabChange("noche")}
        >
          Turno noche
        </button>
      </Tabs>

      <ResultsCard>
        {showEmptyState && (
          <EmptyState>
            {isAdminRole
              ? "Selecciona una sucursal para ver los registros."
              : "No se pudo determinar la sucursal asignada."}
          </EmptyState>
        )}

        {!showEmptyState && isLoading && <Spinner1 />}

        {!showEmptyState && error && (
          <span>ha ocurrido un error: {error.message}</span>
        )}

        {!showEmptyState && !isLoading && !error && (
          <>
            {records.length ? (
              <TablaEnfermeria data={records} onEdit={handleEdit} />
            ) : (
              <EmptyState>Sin registros para esta fecha.</EmptyState>
            )}
          </>
        )}
      </ResultsCard>

      {openModal && (
        <ModalEnfermeriaForm
          record={selectedRecord}
          shift={activeTab}
          registroDate={selectedDate}
          sucursalId={resolvedSucursalId}
          empleadoId={empleado?.id ?? null}
          responsableName={responsableName}
          queryKey={recordsQueryKey}
          onClose={() => setOpenModal(false)}
        />
      )}
    </Container>
  );
}

const Container = styled.div`
  min-height: calc(100dvh - 30px);
  height: calc(100dvh - 30px);
  padding: 20px 22px 28px;
  display: grid;
  gap: 16px;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  background: ${({ theme }) => theme.bgtotal};

  @media ${DeviceMax.mobile} {
    height: auto;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  .titleGroup {
    display: grid;
    gap: 6px;

    p {
      margin: 0;
      color: ${({ theme }) => theme.textsecundary};
      font-weight: 500;
    }
  }

  .selector-sucursal {
    width: min(260px, 100%);

    .select-sucursal {
      width: 100%;
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
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  .dateFilter {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: ${({ theme }) => theme.bg};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 999px;
    padding: 6px 12px;

    button {
      border: none;
      background: transparent;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: ${({ theme }) => theme.text};
      cursor: pointer;
      font-size: 18px;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    input {
      border: none;
      background: transparent;
      color: ${({ theme }) => theme.text};
      font-weight: 600;
      font-size: 0.95rem;
      outline: none;
    }
  }

  @media ${DeviceMax.mobile} {
    align-items: stretch;

    .dateFilter {
      width: 100%;
      justify-content: space-between;
    }
  }
`;

const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
  align-items: center;

  @media ${DeviceMax.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

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
    height: 52px;
    min-height: 32px;
    line-height: 1;
    box-sizing: border-box;
    font-size: 0.85rem;
    text-align: center;
  }

  .tab.active {
    border-color: ${({ theme }) => theme.color1};
    color: ${({ theme }) => theme.color1};
    background: var(--bg-accent-soft);
  }
`;

const ResultsCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: var(--shadow-elev-1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 320px;
  overflow: hidden;

  @media ${DeviceMax.mobile} {
    background: transparent;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
  }
`;

const EmptyState = styled.div`
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.textsecundary};
  text-align: center;
`;
