import { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  AccionTabla,
  Btn1,
  ReportesTable,
  Spinner1,
  UserAuth,
  deleteInvitation,
  getInvitations,
  inviteUser,
  unlinkEmpleado,
  useCompanyStore,
  ModalInvitarUsuario,
  getEmpleados
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
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    app_role: "all",
  });

  const { user } = UserAuth();
  const { dataCompany, showCompany } = useCompanyStore();
  const { profile } = usePermissions();

  const canInvite = ["rrhh", "admin"].includes(
    String(profile?.app_role ?? "")
  );

  useQuery({
    queryKey: ["empresa", user?.id],
    queryFn: () => showCompany({ id_auth: user?.id }),
    enabled: Boolean(user?.id) && !dataCompany?.id,
    refetchOnWindowFocus: false,
  });

  const empresaId = dataCompany?.id ?? null;

  const invalidateInvitationQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["invitaciones"] });
    queryClient.invalidateQueries({ queryKey: ["empleadosDisponibles", empresaId] });
    queryClient.invalidateQueries({ queryKey: ["empleados", empresaId] });
  };

  const resendMutation = useMutation({
    mutationFn: async (row) => {
      if (!empresaId) throw new Error("Empresa no disponible");
      return inviteUser({
        empresa_id: empresaId,
        email: row.email,
        app_role: row.app_role ?? "employee",
        empleado_id: row.empleado_id ?? null,
      });
    },
    onSuccess: (result) => {
      const status = String(result?.status ?? "");
      const emailSent =
        typeof result?.email_sent === "boolean"
          ? result.email_sent
          : status !== "linked";
      const isLinked =
        status === "linked" || (status === "accepted" && emailSent === false);

      if (isLinked || emailSent === false) {
        Swal.fire({
          icon: "info",
          title: "Usuario ya registrado",
          text:
            "El email ya tiene una cuenta confirmada. No se envia invitacion. Si necesita acceso, restablece la contrasena.",
        });
      } else {
        const wasResent = Boolean(result?.resent);
        Swal.fire({
          icon: "success",
          title: wasResent ? "Invitacion reenviada" : "Invitacion enviada",
          text: "El usuario recibira un email de invitacion.",
        });
      }
      invalidateInvitationQueries();
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo reenviar",
        text: err?.message || "Error al reenviar la invitacion.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (rowId) => deleteInvitation(rowId),
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Invitacion eliminada",
        text: "El registro fue eliminado.",
      });
      invalidateInvitationQueries();
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: err?.message || "Error al eliminar la invitacion.",
      });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (row) => {
      if (!row?.empleado_id) {
        throw new Error("Empleado no disponible");
      }
      return unlinkEmpleado(row.empleado_id);
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Usuario desvinculado",
        text: "El empleado quedo disponible para reasignar.",
      });
      invalidateInvitationQueries();
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo desvincular",
        text: err?.message || "Error al desvincular el usuario.",
      });
    },
  });

  const queryFilters = useMemo(
    () => ({
      empresa_id: empresaId,
      status: filters.status,
      search: filters.search,
      app_role: filters.app_role,
    }),
    [empresaId, filters]
  );

  const handleResend = useCallback((row) => {
    Swal.fire({
      icon: "question",
      title: "Reenviar invitacion",
      text: `Se enviara la invitacion a ${row.email}.`,
      showCancelButton: true,
      confirmButtonText: "Reenviar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        resendMutation.mutate(row);
      }
    });
  }, [resendMutation]);

  const handleDelete = useCallback((row) => {
    Swal.fire({
      icon: "warning",
      title: "Eliminar invitacion",
      text: "Esta accion elimina el registro para volver a invitar.",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(row.id);
      }
    });
  }, [deleteMutation]);

  const handleUnlink = useCallback((row) => {
    Swal.fire({
      icon: "warning",
      title: "Desvincular usuario",
      text: "El empleado quedara libre para reasignar.",
      showCancelButton: true,
      confirmButtonText: "Desvincular",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        unlinkMutation.mutate(row);
      }
    });
  }, [unlinkMutation]);

  const renderCardActions = useCallback(
    (row) => {
      const canResend = ["pending", "expired"].includes(row.status);
      const canUnlink =
        Boolean(row.empleado_id) &&
        ["accepted", "linked"].includes(row.status);
      return (
        <>
          {canResend && (
            <AccionTabla
              funcion={() => handleResend(row)}
              fontSize="18px"
              color="#7d7d7d"
              icono={<v.iconoemail />}
            />
          )}
          {canUnlink && (
            <AccionTabla
              funcion={() => handleUnlink(row)}
              fontSize="18px"
              color="#7d7d7d"
              icono={<v.iconoCerrarSesion />}
            />
          )}
          <AccionTabla
            funcion={() => handleDelete(row)}
            fontSize="18px"
            color={v.rojo}
            icono={<v.iconeliminarTabla />}
          />
        </>
      );
    },
    [handleDelete, handleResend, handleUnlink]
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

  const { data: empleados = [] } = useQuery({
    queryKey: ["empleados", empresaId],
    queryFn: () => getEmpleados({ empresa_id: empresaId }),
    enabled: Boolean(empresaId) && canInvite,
    refetchOnWindowFocus: false,
  });

  const empleadosById = useMemo(
    () => new Map((empleados ?? []).map((emp) => [emp.id, emp])),
    [empleados]
  );
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
        accessorFn: (row) => {
          if (!row.empleado_id) return "Sin empleado";
          const empleado = empleadosById.get(row.empleado_id);
          if (!empleado) return `ID ${row.empleado_id}`;
          const fullName = `${empleado?.first_name ?? ""} ${empleado?.last_name ?? ""}`.trim();
          return fullName ;
        },
        meta: {
          cardLabel: "Empleado",
          cardValue: (row) => {
            if (!row.empleado_id) return "Sin empleado";
            const empleado = empleadosById.get(row.empleado_id);
            if (!empleado) return `ID ${row.empleado_id}`;
            const fullName = `${empleado?.first_name ?? ""} ${empleado?.last_name ?? ""}`.trim();
            return fullName ;
          },
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
      {
        id: "acciones",
        header: "Acciones",
        cell: (info) => {
          const row = info.row.original;
          const canResend = ["pending", "expired"].includes(row.status);
          const canUnlink =
            Boolean(row.empleado_id) &&
            ["accepted", "linked"].includes(row.status);
          return (
            <div data-title="Acciones" className="ContentCell acciones">
              {canResend && (
                <AccionTabla
                  funcion={() => handleResend(row)}
                  fontSize="18px"
                  color="#7d7d7d"
                  icono={<v.iconoemail />}
                />
              )}
              {canUnlink && (
                <AccionTabla
                  funcion={() => handleUnlink(row)}
                  fontSize="18px"
                  color="#7d7d7d"
                  icono={<v.iconoCerrarSesion />}
                />
              )}
              <AccionTabla
                funcion={() => handleDelete(row)}
                fontSize="18px"
                color={v.rojo}
                icono={<v.iconeliminarTabla />}
              />
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [empleadosById, handleDelete, handleResend, handleUnlink]
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
          renderCardActions={renderCardActions}
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
