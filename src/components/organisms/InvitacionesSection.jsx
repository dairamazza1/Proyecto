import { useMemo, useState } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import {
  Btn1,
  ReportesTable,
  Spinner1,
  UserAuth,
  getInvitations,
  useCompanyStore,
  ModalInvitarUsuario
} from "../../index";
import { usePermissions } from "../../hooks/usePermissions";
import { v } from "../../styles/variables";

const statusLabels = {
  pending: "Pendiente",
  accepted: "Aceptada",
  linked: "Vinculada",
  expired: "Expirada",
};

const roleLabels = {
  employee: "Empleado",
  rrhh: "RRHH",
  admin: "Admin",
};

const formatDate = (value) => {
  if (!value) return "-";
  const [datePart] = String(value).split("T");
  if (!datePart) return value;
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return datePart;
  return `${day}/${month}/${year}`;
};

export function InvitacionesSection() {
  const [openModal, setOpenModal] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    app_role: "all",
  });

  const { user } = UserAuth();
  const { dataCompany, showCompany } = useCompanyStore();
  const { profile } = usePermissions();

  const canInvite = ["rrhh", "admin", "superadmin"].includes(
    String(profile?.app_role ?? "")
  );

  useQuery({
    queryKey: ["empresa", user?.id],
    queryFn: () => showCompany({ id_auth: user?.id }),
    enabled: Boolean(user?.id) && !dataCompany?.id,
    refetchOnWindowFocus: false,
  });

  const empresaId = dataCompany?.id ?? null;

  const queryFilters = useMemo(
    () => ({
      empresa_id: empresaId,
      status: filters.status,
      search: filters.search,
      app_role: filters.app_role,
    }),
    [empresaId, filters]
  );

  const {
    data: invitaciones = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invitaciones", queryFilters],
    queryFn: () => getInvitations(queryFilters),
    enabled: Boolean(empresaId) && canInvite,
    refetchOnWindowFocus: false,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "email",
        header: "Email",
        meta: {
          cardLabel: "Email",
          cardValue: (row) => row.email ?? "-",
        },
        cell: (info) => (
          <div data-title="Email" className="ContentCell">
            <span>{info.getValue() ?? "-"}</span>
          </div>
        ),
      },
      {
        accessorKey: "app_role",
        header: "Rol",
        meta: {
          cardLabel: "Rol",
          cardValue: (row) =>
            roleLabels[row.app_role] || row.app_role || "-",
        },
        cell: (info) => (
          <div data-title="Rol" className="ContentCell">
            <span>
              {roleLabels[info.getValue()] || info.getValue() || "-"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        meta: {
          cardLabel: "Estado",
          cardValue: (row) =>
            statusLabels[row.status] || row.status || "-",
        },
        cell: (info) => (
          <div data-title="Estado" className="ContentCell">
            <span>
              {statusLabels[info.getValue()] || info.getValue() || "-"}
            </span>
          </div>
        ),
      },
      {
        id: "empleado",
        header: "Empleado",
        accessorFn: (row) =>
          row.empleado_id ? `ID ${row.empleado_id}` : "Sin empleado",
        meta: {
          cardLabel: "Empleado",
          cardValue: (row) =>
            row.empleado_id ? `ID ${row.empleado_id}` : "Sin empleado",
        },
        cell: (info) => (
          <div data-title="Empleado" className="ContentCell">
            <span>{info.getValue() ?? "-"}</span>
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Creado",
        meta: {
          cardLabel: "Creado",
          cardValue: (row) => formatDate(row.created_at),
        },
        cell: (info) => (
          <div data-title="Creado" className="ContentCell">
            <span>{formatDate(info.getValue())}</span>
          </div>
        ),
      },
      {
        accessorKey: "accepted_at",
        header: "Aceptado",
        meta: {
          cardLabel: "Aceptado",
          cardValue: (row) => formatDate(row.accepted_at),
        },
        cell: (info) => (
          <div data-title="Aceptado" className="ContentCell">
            <span>{formatDate(info.getValue())}</span>
          </div>
        ),
      },
    ],
    []
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  if (!canInvite) {
    return null;
  }

  return (
    <Section>
      <div className="sectionHeader">
        <div>
          <h3>Invitaciones</h3>
          <p>Gestiona invitaciones de usuarios por email.</p>
        </div>
        <Btn1
          icono={<v.iconoagregar />}
          titulo="Invitar empleado"
          bgcolor={v.colorPrincipal}
          funcion={() => setOpenModal(true)}
        />
      </div>

      <Filters>
        <label>
          <span>Buscar</span>
          <input
            type="search"
            name="search"
            placeholder="Buscar email"
            value={filters.search}
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
            <option value="pending">Pendiente</option>
            <option value="accepted">Aceptada</option>
            <option value="linked">Vinculada</option>
          </select>
        </label>
        <label>
          <span>Rol</span>
          <select
            name="app_role"
            value={filters.app_role}
            onChange={handleFilterChange}
          >
            <option value="all">Todos</option>
            <option value="employee">Empleado</option>
            <option value="rrhh">RRHH</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      </Filters>

      {isLoading ? (
        <Spinner1 />
      ) : error ? (
        <span>ha ocurrido un error: {error.message}</span>
      ) : invitaciones.length ? (
        <ReportesTable
          data={invitaciones}
          columns={columns}
          getCardTitle={(item) => item.email || "Invitacion"}
        />
      ) : (
        <EmptyState>Sin invitaciones para los filtros.</EmptyState>
      )}

      {openModal && (
        <ModalInvitarUsuario
          empresaId={empresaId}
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
  box-shadow: var(--shadow-elev-1);
  display: grid;
  gap: 16px;
  margin-top: 16px;

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
