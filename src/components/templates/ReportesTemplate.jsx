import styled from "styled-components";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ReportesFilters,
  ReportesTable,
  ReportesTabs,
  Spinner1,
  Title,
  UserAuth,
  getActiveEmpleados,
  getReportCambios,
  getReportLicencias,
  getReportSanciones,
  getReportVacaciones,
  resolvePerfilDisplayName,
  useCompanyStore,
} from "../../index";
import { TABS, statusValues } from "../../utils/dataEstatica";

const formatStatus = (value) =>
  statusValues[String(value ?? "").toLowerCase()] ?? "-";

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
      case "cambios":
        return getReportCambios(normalizedFilters);
      case "sanciones":
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
          accessorKey: "status",
          header: "Estado",
          meta: {
            cardLabel: "Estado",
            cardValue: (row) => formatStatus(row.status),
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
          id: "empleado_reemplazo",
          header: "Empleado de reemplazo",
          accessorFn: (row) => {
            const firstName = row.empleado_reemplazo?.first_name ?? "";
            const lastName = row.empleado_reemplazo?.last_name ?? "";
            return `${firstName} ${lastName}`.trim() || "-";
          },
          meta: {
            cardLabel: "Empleado de reemplazo",
            cardValue: (row) => {
              const firstName = row.empleado_reemplazo?.first_name ?? "";
              const lastName = row.empleado_reemplazo?.last_name ?? "";
              return `${firstName} ${lastName}`.trim() || "-";
            },
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
            cardValue: (row) => formatStatus(row.status),
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
        accessorKey: "status",
        header: "Estado",
        meta: {
          cardLabel: "Estado",
          cardValue: (row) => formatStatus(row.status),
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

      <ReportesTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

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
