import { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import {
  AccionTabla,
  getCambiosStatusByIds,
  getLicenciasStatusByIds,
  getVacacionesStatusByIds,
  ReportesTable,
  Spinner1,
  UserAuth,
  statusValues,
  usePermissions,
  useCompanyStore,
  useMarkNotificacionReadMutation,
  useNotificacionesList,
} from "../../index";
import { Link } from "react-router-dom";
import { v } from "../../styles/variables";
import Swal from "sweetalert2";

const typeLabels = {
  vacaciones_pending: "Vacaciones",
  licencia_pending: "Licencia",
  cambio_pending: "Cambio de actividad",
};

const statusLabels = {
  unread: "No leida",
  read: "Leida",
  archived: "Archivada",
};

const typeFilters = {
  vacaciones: "vacaciones_pending",
  licencias: "licencia_pending",
  cambios: "cambio_pending",
};

const formatDate = (value) => {
  if (!value) return "-";
  const [datePart] = String(value).split("T");
  if (!datePart) return value;
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return datePart;
  return `${day}/${month}/${year}`;
};

const normalizeIds = (ids = []) =>
  Array.from(
    new Set((ids ?? []).filter((id) => id !== null && id !== undefined))
  );

export function NotificacionesSection() {
  const { user } = UserAuth();
  const { profile } = usePermissions();
  const { dataCompany, showCompany } = useCompanyStore();

  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    search: "",
  });
  const { status, type, search } = filters;

  useQuery({
    queryKey: ["empresa", user?.id],
    queryFn: () => showCompany({ id_auth: user?.id }),
    enabled: Boolean(user?.id) && !dataCompany?.id,
    refetchOnWindowFocus: false,
  });

  const empresaId = dataCompany?.id ?? null;
  const perfilId = profile?.id ?? null;
  const queryFilters = useMemo(
    () => ({
      empresa_id: empresaId,
      recipient_perfil_id: perfilId,
      status,
      type: typeFilters[type] ?? "all",
      limit: 100,
    }),
    [empresaId, perfilId, status, type]
  );

  const {
    data: notificaciones = [],
    isLoading,
    error,
  } = useNotificacionesList(
    queryFilters,
    Boolean(empresaId) && Boolean(perfilId)
  );

  const markReadMutation = useMarkNotificacionReadMutation({
    empresaId,
    recipientPerfilId: perfilId,
  });

  const handleMarkRead = useCallback(
    (item) => {
      if (!item?.id || item?.status !== "unread") return;
      markReadMutation.mutate(item.id, {
        onError: (err) => {
          Swal.fire({
            icon: "error",
            title: "No se pudo actualizar",
            text: err?.message || "Error al marcar como leida.",
          });
        },
      });
    },
    [markReadMutation]
  );

  const resolveEmpleadoLabel = useCallback(
    (empleadoId, empleadoData) => {
      if (!empleadoId) return "-";
      const empleado = empleadoData;
      if (!empleado) return `Empleado ID ${empleadoId}`;
      const fullName = `${empleado?.first_name ?? ""} ${empleado?.last_name ?? ""}`.trim();
      return fullName || `Empleado ID ${empleadoId}`;
    },
    []
  );

  const resolveTipoLabel = useCallback(
    (item) => typeLabels[item?.type] || item?.type || "-",
    []
  );

  const renderEmpleadoLink = useCallback(
    (item, label) => {
      if (!item?.empleado_id) {
        return <span>{label || "-"}</span>;
      }
      return (
        <LinkEmpleado
          to={`/empleado/${item.empleado_id}`}
          onClick={() => handleMarkRead(item)}
        >
          {label}
        </LinkEmpleado>
      );
    },
    [handleMarkRead]
  );

  const filteredNotificaciones = useMemo(() => {
    const term = (search ?? "").trim().toLowerCase();
    if (!term) return notificaciones;
    return (notificaciones ?? []).filter((item) => {
      const title = resolveTipoLabel(item).toLowerCase();
      const empleadoLabel = resolveEmpleadoLabel(
        item?.empleado_id,
        item?.empleado
      ).toLowerCase();
      const empleadoId = String(item?.empleado_id ?? "");
      return (
        title.includes(term) ||
        empleadoLabel.includes(term) ||
        empleadoId.includes(term)
      );
    });
  }, [search, notificaciones, resolveEmpleadoLabel, resolveTipoLabel]);

  const renderCardActions = useCallback(
    (item) => {
      const canMark = item?.status === "unread";
      if (!canMark) return null;

      return (
        <>
          {canMark && (
            <AccionTabla
              funcion={() => handleMarkRead(item)}
              fontSize="20px"
              color={v.colorPrincipal}
              icono={<v.iconoCheck />}
            />
          )}
        </>
      );
    },
    [handleMarkRead]
  );

  const entityIds = useMemo(() => {
    const vacaciones = [];
    const licencias = [];
    const cambios = [];

    (notificaciones ?? []).forEach((item) => {
      if (!item?.entity_id || !item?.entity_table) return;
      if (item.entity_table === "empleados_vacaciones") {
        vacaciones.push(item.entity_id);
      } else if (item.entity_table === "empleados_licencias") {
        licencias.push(item.entity_id);
      } else if (item.entity_table === "empleados_cambios_actividades") {
        cambios.push(item.entity_id);
      }
    });

    return {
      vacaciones: normalizeIds(vacaciones),
      licencias: normalizeIds(licencias),
      cambios: normalizeIds(cambios),
    };
  }, [notificaciones]);

  const { data: entityStatusMap } = useQuery({
    queryKey: [
      "notificacionesEntityStatus",
      entityIds.vacaciones,
      entityIds.licencias,
      entityIds.cambios,
    ],
    queryFn: async () => {
      const [vacaciones, licencias, cambios] = await Promise.all([
        entityIds.vacaciones.length
          ? getVacacionesStatusByIds(entityIds.vacaciones)
          : Promise.resolve([]),
        entityIds.licencias.length
          ? getLicenciasStatusByIds(entityIds.licencias)
          : Promise.resolve([]),
        entityIds.cambios.length
          ? getCambiosStatusByIds(entityIds.cambios)
          : Promise.resolve([]),
      ]);

      const map = new Map();
      (vacaciones ?? []).forEach((item) => {
        map.set(`empleados_vacaciones:${item.id}`, item.status);
      });
      (licencias ?? []).forEach((item) => {
        map.set(`empleados_licencias:${item.id}`, item.status);
      });
      (cambios ?? []).forEach((item) => {
        map.set(`empleados_cambios_actividades:${item.id}`, item.status);
      });
      return map;
    },
    enabled:
      entityIds.vacaciones.length > 0 ||
      entityIds.licencias.length > 0 ||
      entityIds.cambios.length > 0,
    refetchOnWindowFocus: false,
  });

  const resolveEntityStatus = useCallback(
    (item) => {
      if (!item?.entity_id || !item?.entity_table) return "-";
      const map = entityStatusMap instanceof Map ? entityStatusMap : new Map();
      const key = `${item.entity_table}:${item.entity_id}`;
      const status = map.get(key);
      return statusValues[status] || status || "-";
    },
    [entityStatusMap]
  );

  const columns = useMemo(
    () => [
      {
        id: "titulo",
        header: "Titulo",
        accessorFn: (row) => resolveTipoLabel(row),
        meta: {
          cardLabel: "Titulo",
          cardValue: (row) => resolveTipoLabel(row),
        },
        cell: (info) => (
          <div data-title="Titulo" className="ContentCell">
            <span>{info.getValue() ?? "-"}</span>
          </div>
        ),
      },
      {
        id: "empleado",
        header: "Empleado",
        accessorFn: (row) =>
          resolveEmpleadoLabel(row.empleado_id, row.empleado),
        meta: {
          cardLabel: "Empleado",
          cardValue: (row) => {
            const label = resolveEmpleadoLabel(
              row.empleado_id,
              row.empleado
            );
            return renderEmpleadoLink(row, label);
          },
        },
        cell: (info) => (
          <div data-title="Empleado" className="ContentCell">
            {renderEmpleadoLink(info.row.original, info.getValue() ?? "-")}
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Fecha",
        meta: {
          cardLabel: "Fecha",
          cardValue: (row) => formatDate(row.created_at),
        },
        cell: (info) => (
          <div data-title="Fecha" className="ContentCell">
            <span>{formatDate(info.getValue())}</span>
          </div>
        ),
      },
      {
        id: "estado",
        header: "Estado",
        accessorFn: (row) => resolveEntityStatus(row),
        meta: {
          cardLabel: "Estado",
          cardValue: (row) => resolveEntityStatus(row),
        },
        cell: (info) => (
          <div data-title="Estado" className="ContentCell">
            <span>{info.getValue() ?? "-"}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Notificacion",
        meta: {
          cardLabel: "Notificacion",
          cardValue: (row) => statusLabels[row.status] || row.status || "-",
        },
        cell: (info) => (
          <div data-title="Notificacion" className="ContentCell">
            <span>{statusLabels[info.getValue()] || info.getValue() || "-"}</span>
          </div>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: (info) => (
          <div data-title="Acciones" className="ContentCell acciones">
            {info.row.original?.status === "unread" && (
              <AccionTabla
                funcion={() => handleMarkRead(info.row.original)}
                fontSize="20px"
                color={v.colorPrincipal}
                icono={<v.iconoCheck />}
              />
            )}
          </div>
        ),
        enableSorting: false,
      },
    ],
    [
      handleMarkRead,
      renderEmpleadoLink,
      resolveEmpleadoLabel,
      resolveEntityStatus,
      resolveTipoLabel,
    ]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
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
        <div>
          <h3>Notificaciones internas</h3>
          <p>Revisa solicitudes pendientes y novedades recientes.</p>
        </div>
      </div>

      <Filters>
        <label>
          <span>Buscar</span>
          <input
            type="search"
            name="search"
            placeholder="Buscar empleado o titulo"
            value={search}
            onChange={handleFilterChange}
          />
        </label>
        <label>
          <span>Estado</span>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="all">Todos</option>
            <option value="unread">No leidas</option>
            <option value="read">Leidas</option>
            <option value="archived">Archivadas</option>
          </select>
        </label>
        <label>
          <span>Tipo</span>
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
          >
            <option value="all">Todos</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="licencias">Licencia</option>
            <option value="cambios">Cambios de actividad</option>
          </select>
        </label>
      </Filters>

      {filteredNotificaciones.length ? (
        <ReportesTable
          data={filteredNotificaciones}
          columns={columns}
          getCardTitle={(item) => resolveTipoLabel(item)}
          renderCardActions={renderCardActions}
        />
      ) : (
        <EmptyState>Sin notificaciones para los filtros.</EmptyState>
      )}
    </Section>
  );
}

const Section = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: var(--shadow-elev-1);
  display: grid;
  gap: 16px;

  .sectionHeader {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;

    h3 {
      margin: 0 0 6px;
      font-size: 1.1rem;
    }

    p {
      margin: 0;
      color: ${({ theme }) => theme.textsecundary};
      font-size: 0.95rem;
    }
  }
`;

const Filters = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));

  label {
    display: grid;
    gap: 6px;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.textsecundary};
  }

  input,
  select {
    border: 2px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    padding: 10px 12px;
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    outline: none;
  }
`;

const EmptyState = styled.div`
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.textsecundary};
  text-align: center;
`;

const LinkEmpleado = styled(Link)`
  color: ${({ theme }) => theme.text};
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: ${({ theme }) => theme.color1};
  }
`;
