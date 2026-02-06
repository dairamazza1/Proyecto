import styled from "styled-components";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ReportesFilters,
  ReportesTable,
  ReportesTabs,
  Spinner1,
  Title,
  UserAuth,
  getActiveEmpleados,
  getReportCambios,
  getReportFaltas,
  getReportLicencias,
  getReportSanciones,
  getReportVacaciones,
  resolvePerfilDisplayName,
  usePermissions,
  useCompanyStore,
} from "../../index";
import { TABS, statusValues } from "../../utils/dataEstatica";

const formatStatus = (value) =>
  statusValues[String(value ?? "").toLowerCase()] ?? "-";

const OBSERVATION_MAX = 60;

const normalizeObservation = (value) => String(value ?? "").trim();

const buildObservationLabel = (value) => normalizeObservation(value) || "-";

const renderObservationCell = (value) => {
  const text = normalizeObservation(value);
  if (!text) return <span>-</span>;
  const truncated =
    text.length > OBSERVATION_MAX
      ? `${text.slice(0, OBSERVATION_MAX).trim()}...`
      : text;
  return (
    <div className="observationCell">
      <span className="observationText">{truncated}</span>
      {text.length > OBSERVATION_MAX && (
        <button
          type="button"
          className="observationLink"
          onClick={() =>
            Swal.fire({
              title: "Observaciones",
              text,
            })
          }
        >
          ver más
        </button>
      )}
    </div>
  );
};

const formatJustificado = (value) => (value ? "Si" : "No");

const formatNombre = (persona) => {
  if (!persona) return "-";
  const firstName = persona.first_name ?? "";
  const lastName = persona.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || "-";
};

const formatTipo = (value) => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "-";
  if (raw === "ordinarias") return "Ordinarias";
  if (raw === "profilacticas") return "Profilacticas";
  return value;
};

const formatDate = (value) => {
  if (!value) return "-";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const pad = (value) => String(value).padStart(2, "0");

const getMonthRange = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0);
  return {
    start: `${year}-${pad(month + 1)}-01`,
    end: `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(
      lastDay.getDate()
    )}`,
  };
};

export function ReportesTemplate() {
  const { start: defaultFromDate, end: defaultToDate } = getMonthRange(
    new Date()
  );
  const [activeTab, setActiveTab] = useState("vacaciones");
  const [filters, setFilters] = useState({
    fromDate: defaultFromDate,
    toDate: defaultToDate,
    empleadoId: "",
  });

  const { userRole } = usePermissions();
  const canSeeRestricted = useMemo(
    () => ["rrhh", "admin", "superadmin"].includes(String(userRole ?? "")),
    [userRole]
  );

  const visibleTabs = useMemo(() => {
    if (canSeeRestricted) return TABS;
    return TABS.filter((tab) => !["cambios", "sanciones"].includes(tab.id));
  }, [canSeeRestricted]);

  useEffect(() => {
    if (canSeeRestricted) return;
    if (activeTab === "cambios" || activeTab === "sanciones") {
      setActiveTab("vacaciones");
    }
  }, [activeTab, canSeeRestricted]);

  const { dataCompany, showCompany } = useCompanyStore();
  const { user } = UserAuth();

  useQuery({
    queryKey: ["empresa", user?.id],
    queryFn: () => showCompany({ id_auth: user?.id }),
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
  });

  const empresaId = dataCompany?.id ?? null;

  const { data: empleadosActivos = [], isLoading: loadingEmpleados } = useQuery(
    {
      queryKey: ["empleadosActivos", empresaId],
      queryFn: () => getActiveEmpleados({ empresa_id: empresaId }),
      refetchOnWindowFocus: false,
    }
  );

  const normalizedFilters = useMemo(
    () => ({
      fromDate: filters.fromDate || null,
      toDate: filters.toDate || null,
      empleado_id: filters.empleadoId || null,
      empresa_id: empresaId || null,
    }),
    [filters, empresaId]
  );

  const reportQueryFn = () => {
    switch (activeTab) {
      case "licencias":
        return getReportLicencias(normalizedFilters);
      case "faltas":
        return getReportFaltas(normalizedFilters);
      case "cambios":
        if (!canSeeRestricted) return getReportVacaciones(normalizedFilters);
        return getReportCambios(normalizedFilters);
      case "sanciones":
        if (!canSeeRestricted) return getReportVacaciones(normalizedFilters);
        return getReportSanciones(normalizedFilters);
      default:
        return getReportVacaciones(normalizedFilters);
    }
  };

  const {
    data: reportData = [],
    isLoading: loadingReport,
    error: reportError,
  } = useQuery({
    queryKey: ["reportes", activeTab, normalizedFilters],
    queryFn: reportQueryFn,
    refetchOnWindowFocus: false,
  });

  const getVerifiedByLabel = (row) =>
    resolvePerfilDisplayName(row?.verificador, row?.verified_by);
  const getCreatedByLabel = (row) =>
    resolvePerfilDisplayName(row?.creador, row?.created_by);

  const columns = useMemo(() => {
    const empleadoColumn = {
      id: "empleado",
      header: "Empleado",
      accessorFn: (row) =>
        `${row.empleado?.last_name ?? ""}, ${
          row.empleado?.first_name ?? ""
        }`.trim(),
      meta: {
        cardLabel: "Empleado",
        cardValue: (row) =>
          `${row.empleado?.last_name ?? ""}, ${
            row.empleado?.first_name ?? ""
          }`.trim() || "-",
      },
      cell: (info) => (
        <div data-title="Empleado" className="ContentCell">
          <span>{info.getValue() || "-"}</span>
        </div>
      ),
    };

    const legajoColumn = {
      id: "legajo",
      header: "Legajo",
      accessorFn: (row) => row.empleado?.employee_id_number ?? "-",
      meta: {
        cardLabel: "Legajo",
        cardValue: (row) => {
          const empleadoId = row.empleado?.id;
          const value = row.empleado?.employee_id_number ?? "-";
          return empleadoId ? (
            <LegajoLink
              to={`/empleados/${empleadoId}`}
              title="Acceder a empleado"
              aria-label={`Acceder a empleado ${value}`}
            >
              {value}
            </LegajoLink>
          ) : (
            value
          );
        },
      },
      cell: (info) => (
        <div data-title="Legajo" className="ContentCell">
          {info.row.original?.empleado?.id ? (
            <LegajoLink
              to={`/empleados/${info.row.original.empleado.id}`}
              title="Acceder a empleado"
              aria-label={`Acceder a empleado ${info.getValue() ?? "-"}`}
            >
              {info.getValue() ?? "-"}
            </LegajoLink>
          ) : (
            <span>{info.getValue() ?? "-"}</span>
          )}
        </div>
      ),
    };

    if (activeTab === "licencias") {
      return [
        legajoColumn,
        empleadoColumn,
        {
          id: "tipo",
          header: "Tipo",
          accessorFn: (row) => row.licencia_tipo?.name ?? "-",
          meta: {
            cardLabel: "Tipo",
            cardValue: (row) => row.licencia_tipo?.name ?? "-",
          },
          cell: (info) => (
            <div data-title="Tipo" className="ContentCell">
              <span>{info.getValue() ?? "-"}</span>
            </div>
          ),
        },
        {
          accessorKey: "start_date",
          header: "Desde",
          meta: {
            cardLabel: "Desde",
            cardValue: (row) => formatDate(row.start_date),
          },
          cell: (info) => (
            <div data-title="Desde" className="ContentCell">
              <span>{formatDate(info.getValue())}</span>
            </div>
          ),
        },
        {
          accessorKey: "end_date",
          header: "Hasta",
          meta: {
            cardLabel: "Hasta",
            cardValue: (row) => formatDate(row.end_date),
          },
          cell: (info) => (
            <div data-title="Hasta" className="ContentCell">
              <span>{formatDate(info.getValue())}</span>
            </div>
          ),
        },
        {
          accessorKey: "days",
          header: "Dias",
          meta: {
            cardLabel: "Dias",
            cardValue: (row) => row.days ?? "-",
          },
          cell: (info) => (
            <div data-title="Dias" className="ContentCell">
              <span>{info.getValue() ?? "-"}</span>
            </div>
          ),
        },
        {
          accessorKey: "observations",
          header: "Observaciones",
          meta: {
            cardLabel: "Observaciones",
            cardValue: (row) => (
              <span className="observationText">
                {buildObservationLabel(row.observations)}
              </span>
            ),
          },
          cell: (info) => (
            <div data-title="Observaciones" className="ContentCell observation">
              {renderObservationCell(info.getValue())}
            </div>
          ),
        },
        {
          accessorKey: "status",
          header: "Estado",
          meta: {
            cardLabel: "Estado",
            cardValue: (row) => (
              <StatusPill className={formatStatus(row.status)}>
                {formatStatus(row.status)}
              </StatusPill>
            ),
          },
          cell: (info) => (
            <div data-title="Estado" className="ContentCell">
              <StatusPill className={formatStatus(info.getValue())}>
                {formatStatus(info.getValue())}
              </StatusPill>
            </div>
          ),
        },
        {
          id: "verified_by",
          header: "Verificado por",
          accessorFn: (row) => getVerifiedByLabel(row),
          meta: {
            cardLabel: "Verificado por",
            cardValue: (row) => getVerifiedByLabel(row),
          },
          cell: (info) => (
            <div data-title="Verificado por" className="ContentCell">
              <span>{info.getValue() ?? "-"}</span>
            </div>
          ),
          enableSorting: true,
          sortingFn: "alphanumeric",
        },
      ];
    }

    if (activeTab === "faltas") {
      return [
        legajoColumn,
        empleadoColumn,
        {
          id: "categoria",
          header: "Categoria",
          accessorFn: (row) => row.falta_tipo?.categoria?.name ?? "-",
          meta: {
            cardLabel: "Categoria",
            cardValue: (row) => row.falta_tipo?.categoria?.name ?? "-",
          },
          cell: (info) => (
            <div data-title="Categoria" className="ContentCell">
              <span>{info.getValue() ?? "-"}</span>
            </div>
          ),
        },
        {
          id: "tipo",
          header: "Tipo",
          accessorFn: (row) => row.falta_tipo?.name ?? "-",
          meta: {
            cardLabel: "Tipo",
            cardValue: (row) => row.falta_tipo?.name ?? "-",
          },
          cell: (info) => (
            <div data-title="Tipo" className="ContentCell">
              <span>{info.getValue() ?? "-"}</span>
            </div>
          ),
        },
        {
          accessorKey: "start_date",
          header: "Desde",
          meta: {
            cardLabel: "Desde",
            cardValue: (row) => formatDate(row.start_date),
          },
          cell: (info) => (
            <div data-title="Desde" className="ContentCell">
              <span>{formatDate(info.getValue())}</span>
            </div>
          ),
        },
        {
          accessorKey: "end_date",
          header: "Hasta",
          meta: {
            cardLabel: "Hasta",
            cardValue: (row) => formatDate(row.end_date),
          },
          cell: (info) => (
            <div data-title="Hasta" className="ContentCell">
              <span>{formatDate(info.getValue())}</span>
            </div>
          ),
        },
        {
          accessorKey: "days",
          header: "Dias",
          meta: {
            cardLabel: "Dias",
            cardValue: (row) => row.days ?? "-",
          },
          cell: (info) => (
            <div data-title="Dias" className="ContentCell">
              <span>{info.getValue() ?? "-"}</span>
            </div>
          ),
        },
        {
          accessorKey: "observations",
          header: "Observaciones",
          meta: {
            cardLabel: "Observaciones",
            cardValue: (row) => (
              <span className="observationText">
                {buildObservationLabel(row.observations)}
              </span>
            ),
          },
          cell: (info) => (
            <div data-title="Observaciones" className="ContentCell observation">
              {renderObservationCell(info.getValue())}
            </div>
          ),
        },
        {
          accessorKey: "is_justified",
          header: "Justificado",
          meta: {
            cardLabel: "Justificado",
            cardValue: (row) => formatJustificado(row.is_justified),
          },
          cell: (info) => (
            <div data-title="Justificado" className="ContentCell">
              <span>{formatJustificado(info.getValue())}</span>
            </div>
          ),
        },
        {
          id: "empleado_reemplazo",
          header: "Empleado de reemplazo",
          accessorFn: (row) => formatNombre(row.empleado_reemplazo),
          meta: {
            cardLabel: "Empleado de reemplazo",
            cardValue: (row) => formatNombre(row.empleado_reemplazo),
          },
          cell: (info) => (
            <div data-title="Empleado de reemplazo" className="ContentCell">
              <span>{info.getValue() ?? "-"}</span>
            </div>
          ),
        },
        {
          accessorKey: "status",
          header: "Estado",
          meta: {
            cardLabel: "Estado",
            cardValue: (row) => (
              <StatusPill className={formatStatus(row.status)}>
                {formatStatus(row.status)}
              </StatusPill>
            ),
          },
          cell: (info) => (
            <div data-title="Estado" className="ContentCell">
              <StatusPill className={formatStatus(info.getValue())}>
                {formatStatus(info.getValue())}
              </StatusPill>
            </div>
          ),
        },
        {
          id: "verified_by",
          header: "Verificado por",
          accessorFn: (row) => getVerifiedByLabel(row),
          meta: {
            cardLabel: "Verificado por",
            cardValue: (row) => getVerifiedByLabel(row),
          },
          cell: (info) => (
            <div data-title="Verificado por" className="ContentCell">
              <span>{info.getValue() ?? "-"}</span>
            </div>
          ),
          enableSorting: true,
          sortingFn: "alphanumeric",
        },
      ];
    }

    if (activeTab === "cambios") {
      return [
        legajoColumn,
        empleadoColumn,
        {
          accessorKey: "start_date",
          header: "Desde",
          meta: {
            cardLabel: "Desde",
            cardValue: (row) => formatDate(row.start_date),
          },
          cell: (info) => (
            <div data-title="Desde" className="ContentCell">
              <span>{formatDate(info.getValue())}</span>
            </div>
          ),
        },
        {
          accessorKey: "end_date",
          header: "Hasta",
          meta: {
            cardLabel: "Hasta",
            cardValue: (row) => formatDate(row.end_date),
          },
          cell: (info) => (
            <div data-title="Hasta" className="ContentCell">
              <span>{formatDate(info.getValue())}</span>
            </div>
          ),
        },
        {
          accessorKey: "change_reason",
          header: "Motivo",
          meta: {
            cardLabel: "Motivo",
            cardValue: (row) => row.change_reason ?? "-",
          },
          cell: (info) => (
            <div data-title="Motivo" className="ContentCell">
              <span>{info.getValue() ?? "-"}</span>
            </div>
          ),
        },
        {
          accessorKey: "status",
          header: "Estado",
          meta: {
            cardLabel: "Estado",
            cardValue: (row) => (
              <StatusPill className={formatStatus(row.status)}>
                {formatStatus(row.status)}
              </StatusPill>
            ),
          },
          cell: (info) => (
            <div data-title="Estado" className="ContentCell">
              <StatusPill className={formatStatus(info.getValue())}>
                {formatStatus(info.getValue())}
              </StatusPill>
            </div>
          ),
        },
        {
          id: "verified_by",
          header: "Verificado por",
          accessorFn: (row) => getVerifiedByLabel(row),
          meta: {
            cardLabel: "Verificado por",
            cardValue: (row) => getVerifiedByLabel(row),
          },
          cell: (info) => (
            <div data-title="Verificado por" className="ContentCell">
              <span>{info.getValue() ?? "-"}</span>
            </div>
          ),
          enableSorting: true,
          sortingFn: "alphanumeric",
        },
      ];
    }

    if (activeTab === "sanciones") {
      return [
        legajoColumn,
        empleadoColumn,
        {
          accessorKey: "sanction_type",
          header: "Tipo",
          meta: {
            cardLabel: "Tipo",
            cardValue: (row) => row.sanction_type ?? "-",
          },
          cell: (info) => (
            <div data-title="Tipo" className="ContentCell">
              <span>{info.getValue() ?? "-"}</span>
            </div>
          ),
        },
        {
          accessorKey: "sanction_date_start",
          header: "Desde",
          meta: {
            cardLabel: "Desde",
            cardValue: (row) => formatDate(row.sanction_date_start),
          },
          cell: (info) => (
            <div data-title="Desde" className="ContentCell">
              <span>{formatDate(info.getValue())}</span>
            </div>
          ),
        },
        {
          accessorKey: "sanction_date_end",
          header: "Hasta",
          meta: {
            cardLabel: "Hasta",
            cardValue: (row) => formatDate(row.sanction_date_end),
          },
          cell: (info) => (
            <div data-title="Hasta" className="ContentCell">
              <span>{formatDate(info.getValue())}</span>
            </div>
          ),
        },
        {
          id: "created_by",
          header: "Creado por",
          accessorFn: (row) => getCreatedByLabel(row),
          meta: {
            cardLabel: "Creado por",
            cardValue: (row) => getCreatedByLabel(row),
          },
          cell: (info) => (
            <div data-title="Creado por" className="ContentCell">
              <span>{info.getValue() ?? "-"}</span>
            </div>
          ),
          enableSorting: true,
          sortingFn: "alphanumeric",
        },
      ];
    }

    return [
      legajoColumn,
      empleadoColumn,
      {
        accessorKey: "type",
        header: "Tipo",
        meta: {
          cardLabel: "Tipo",
          cardValue: (row) => formatTipo(row.type),
        },
        cell: (info) => (
          <div data-title="Tipo" className="ContentCell">
            <span>{formatTipo(info.getValue())}</span>
          </div>
        ),
      },
      {
        accessorKey: "start_date",
        header: "Desde",
        meta: {
          cardLabel: "Desde",
          cardValue: (row) => formatDate(row.start_date),
        },
        cell: (info) => (
          <div data-title="Desde" className="ContentCell">
            <span>{formatDate(info.getValue())}</span>
          </div>
        ),
      },
      {
        accessorKey: "end_date",
        header: "Hasta",
        meta: {
          cardLabel: "Hasta",
          cardValue: (row) => formatDate(row.end_date),
        },
        cell: (info) => (
          <div data-title="Hasta" className="ContentCell">
            <span>{formatDate(info.getValue())}</span>
          </div>
        ),
      },
      {
        accessorKey: "days_taken",
        header: "Dias",
        meta: {
          cardLabel: "Dias",
          cardValue: (row) => row.days_taken ?? "-",
        },
        cell: (info) => (
          <div data-title="Dias" className="ContentCell">
            <span>{info.getValue() ?? "-"}</span>
          </div>
        ),
      },
      {
        accessorKey: "observations",
        header: "Observaciones",
        meta: {
          cardLabel: "Observaciones",
          cardValue: (row) => (
            <span className="observationText">
              {buildObservationLabel(row.observations)}
            </span>
          ),
        },
        cell: (info) => (
          <div data-title="Observaciones" className="ContentCell observation">
            {renderObservationCell(info.getValue())}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        meta: {
          cardLabel: "Estado",
          cardValue: (row) => (
            <StatusPill className={formatStatus(row.status)}>
              {formatStatus(row.status)}
            </StatusPill>
          ),
        },
        cell: (info) => (
          <div data-title="Estado" className="ContentCell">
            <StatusPill className={formatStatus(info.getValue())}>
              {formatStatus(info.getValue())}
            </StatusPill>
          </div>
        ),
      },
      {
        id: "verified_by",
        header: "Verificado por",
        accessorFn: (row) => getVerifiedByLabel(row),
        meta: {
          cardLabel: "Verificado por",
          cardValue: (row) => getVerifiedByLabel(row),
        },
        cell: (info) => (
          <div data-title="Verificado por" className="ContentCell">
            <span>{info.getValue() ?? "-"}</span>
          </div>
        ),
        enableSorting: true,
        sortingFn: "alphanumeric",
      },
    ];
  }, [activeTab, getVerifiedByLabel, getCreatedByLabel]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      if (field === "fromDate") {
        const next = { ...prev, fromDate: value };
        if (value && prev.toDate && value > prev.toDate) {
          next.toDate = value;
        }
        return next;
      }
      if (field === "toDate") {
        const next = { ...prev, toDate: value };
        if (value && prev.fromDate && value < prev.fromDate) {
          next.fromDate = value;
        }
        return next;
      }
      return { ...prev, [field]: value };
    });
  };

  return (
    <Container>
      <Header>
        <Title>Reportes</Title>
      </Header>

      <ReportesTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <FiltersCard>
        <ReportesFilters
          filters={filters}
          onChange={handleFilterChange}
          empleados={empleadosActivos}
          loadingEmpleados={loadingEmpleados}
        />
      </FiltersCard>

      <ResultsCard>
        {loadingReport ? (
          <Spinner1 />
        ) : reportError ? (
          <span>ha ocurrido un error: {reportError.message}</span>
        ) : reportData?.length ? (
          <ReportesTable
            data={reportData}
            columns={columns}
            getCardTitle={(item) =>
              `${item.empleado?.last_name ?? ""}, ${
                item.empleado?.first_name ?? ""
              }`.trim() || "Registro"
            }
          />
        ) : (
          <EmptyState>Sin registros para los filtros seleccionados.</EmptyState>
        )}
      </ResultsCard>
    </Container>
  );
}

const StatusPill = styled.span`
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
  background: var(--bg-success-soft);
  color: var(--color-success);

  &.Pendiente {
    background: var(--bg-warning-soft);
    color: var(--color-warning);
  }

  &.Rechazado {
    background: var(--bg-danger-soft);
    color: var(--color-danger);
  }
`;
const Container = styled.div`
  /* min-height: calc(100dvh - 30px); */
  width: 100%;
  min-width: 0;
  padding: 20px 22px 28px;
  display: grid;
  gap: 16px;
  background: ${({ theme }) => theme.bgtotal};
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const FiltersCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 18px 20px;
  box-shadow: var(--shadow-elev-1);
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

const LegajoLink = styled(Link)`
  color: ${({ theme }) => theme.text};
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 700;

  &:hover {
    color: ${({ theme }) => theme.color1};
  }
`;
