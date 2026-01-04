import styled from "styled-components";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  useCompanyStore,
} from "../../index";

const TABS = [
  { id: "vacaciones", label: "Vacaciones" },
  { id: "licencias", label: "Licencias" },
  { id: "cambios", label: "Cambios de turnos" },
  { id: "sanciones", label: "Sanciones" },
];

const statusValues = {
  rejected: "Rechazado",
  approved: "Aprobado",
  pending: "Pendiente",
};

const formatStatus = (value) =>
  statusValues[String(value ?? "").toLowerCase()] ?? "-";

const formatDate = (value) => {
  if (!value) return "-";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

export function ReportesTemplate() {
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState("vacaciones");
  const [filters, setFilters] = useState({
    year: currentYear,
    month: "",
    day: "",
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

  const { data: empleadosActivos = [], isLoading: loadingEmpleados } = useQuery({
    queryKey: ["empleadosActivos", empresaId],
    queryFn: () => getActiveEmpleados({ empresa_id: empresaId }),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (activeTab === "vacaciones" && !filters.year) {
      setFilters((prev) => ({ ...prev, year: currentYear }));
    }
  }, [activeTab, currentYear, filters.year]);

  const normalizedFilters = useMemo(
    () => ({
      year: filters.year ? Number(filters.year) : null,
      month: filters.month ? Number(filters.month) : null,
      day: filters.day ? Number(filters.day) : null,
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

  const columns = useMemo(() => {
    const empleadoColumn = {
      id: "empleado",
      header: "Empleado",
      accessorFn: (row) =>
        `${row.empleado?.last_name ?? ""}, ${row.empleado?.first_name ?? ""}`.trim(),
      meta: {
        cardLabel: "Empleado",
        cardValue: (row) =>
          `${row.empleado?.last_name ?? ""}, ${row.empleado?.first_name ?? ""}`.trim() || "-",
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
        cardValue: (row) => row.empleado?.employee_id_number ?? "-",
      },
      cell: (info) => (
        <div data-title="Legajo" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
    };

    if (activeTab === "licencias") {
      return [
        empleadoColumn,
        legajoColumn,
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
              <span>{formatStatus(info.getValue())}</span>
            </div>
          ),
        },
      ];
    }

    if (activeTab === "cambios") {
      return [
        empleadoColumn,
        legajoColumn,
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
          accessorKey: "status",
          header: "Estado",
          meta: {
            cardLabel: "Estado",
            cardValue: (row) => formatStatus(row.status),
          },
          cell: (info) => (
            <div data-title="Estado" className="ContentCell">
              <span>{formatStatus(info.getValue())}</span>
            </div>
          ),
        },
      ];
    }

    if (activeTab === "sanciones") {
      return [
        empleadoColumn,
        legajoColumn,
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
      ];
    }

    return [
      empleadoColumn,
      legajoColumn,
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
            <span>{formatStatus(info.getValue())}</span>
          </div>
        ),
      },
    ];
  }, [activeTab]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Container>
      <Header>
        <Title>Reportes</Title>
      </Header>

      <ReportesTabs
        tabs={TABS}
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
    </Container>
  );
}

const Container = styled.div`
  min-height: calc(100dvh - 30px);
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
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
`;

const EmptyState = styled.div`
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.textsecundary};
  text-align: center;
`;
