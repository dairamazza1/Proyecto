import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { Btn1 } from "../molecules/Btn1";
import { Spinner1 } from "../molecules/Spinner1";
import { InputText } from "./formularios/inputText";
import {
  assignPacienteEquipoTratante,
  finishPacienteEquipoTratanteAssignment,
  reopenPacienteEquipoTratanteAssignment,
  searchPacienteEquipoProfesionales,
} from "../../supabase/crudPacientes";
import {
  filterPacienteEquipoRowsByIngreso,
  getPacienteEquipoArea,
  getPacienteEquipoPuesto,
  isPacienteEquipoAssignmentActive,
  isPacienteEquipoClinicallyEligible,
} from "../../utils/pacienteEquipoTratante";
import { DeviceMax } from "../../styles/breakpoints";
import { v } from "../../styles/variables";

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value);

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
};

const getIdentity = (row) =>
  String(row?.empleado_id ?? row?.empleado?.id ?? row?.id ?? "").trim();

const getProfessionalName = (row) =>
  [row?.empleado?.first_name ?? row?.first_name, row?.empleado?.last_name ?? row?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

export function PacienteEquipoTratanteTab({
  pacienteId,
  ingreso,
  empresaId,
  data = [],
  canManageTeam = false,
}) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const rows = useMemo(
    () => filterPacienteEquipoRowsByIngreso(data, ingreso?.id ?? null),
    [data, ingreso?.id],
  );

  const activeAssignmentsByEmployeeId = useMemo(() => {
    const map = new Map();

    (rows ?? []).forEach((item) => {
      if (!isPacienteEquipoAssignmentActive(item)) return;
      map.set(getIdentity(item), item);
    });

    return map;
  }, [rows]);

  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ["pacienteEquipoProfesionalesSearch", empresaId, debouncedSearch],
    queryFn: () =>
      searchPacienteEquipoProfesionales({
        empresaId,
        term: debouncedSearch,
        limit: 12,
      }),
    enabled:
      Boolean(empresaId) &&
      Boolean(ingreso?.id) &&
      canManageTeam &&
      debouncedSearch.length >= 2,
    refetchOnWindowFocus: false,
  });

  const visibleSearchResults = useMemo(
    () =>
      (searchResults ?? []).filter(
        (item) => !activeAssignmentsByEmployeeId.has(getIdentity(item)),
      ),
    [activeAssignmentsByEmployeeId, searchResults],
  );

  const invalidateTeam = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["pacienteEquipo", String(pacienteId)],
      exact: true,
    });
    await queryClient.invalidateQueries({ queryKey: ["pacienteEquipo", pacienteId] });
  };

  const assignMutation = useMutation({
    mutationFn: (empleadoId) =>
      assignPacienteEquipoTratante({
        pacienteId,
        ingresoId: ingreso?.id,
        empleadoId,
      }),
    onSuccess: async () => {
      await invalidateTeam();
      setSearchTerm("");
      setDebouncedSearch("");
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo asignar el profesional",
        text: error?.message ?? "Intenta nuevamente.",
      });
    },
  });

  const finishMutation = useMutation({
    mutationFn: (assignmentId) =>
      finishPacienteEquipoTratanteAssignment(assignmentId),
    onSuccess: invalidateTeam,
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo finalizar la asignacion",
        text: error?.message ?? "Intenta nuevamente.",
      });
    },
  });

  const reopenMutation = useMutation({
    mutationFn: (assignmentId) =>
      reopenPacienteEquipoTratanteAssignment(assignmentId),
    onSuccess: invalidateTeam,
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo reactivar la asignacion",
        text: error?.message ?? "Intenta nuevamente.",
      });
    },
  });

  const isMutating =
    assignMutation.isPending ||
    finishMutation.isPending ||
    reopenMutation.isPending;

  const handleFinishAssignment = async (assignment) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Finalizar asignacion",
      text: "El profesional dejara de tener permisos clinicos sobre esta internacion.",
      showCancelButton: true,
      confirmButtonText: "Finalizar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;
    finishMutation.mutate(assignment.id);
  };

  if (!ingreso?.id) {
    return (
      <EmptyState>
        Seleccione una internacion para ver y administrar el equipo tratante.
      </EmptyState>
    );
  }

  return (
    <Container>
      {canManageTeam ? (
        <section className="searchPanel">
          <InputText icono={<v.iconoBuscar />}>
            <input
              className="form__field"
              type="search"
              placeholder="Buscar profesional"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              disabled={isMutating}
            />
            <label className="form__label">
              Buscar profesional para esta internacion
            </label>
          </InputText>

          {!!searchTerm.trim() ? (
            <div className="suggestions">
              {searchLoading ? (
                <div className="suggestionItem muted">Buscando profesionales...</div>
              ) : visibleSearchResults.length ? (
                visibleSearchResults.map((item) => {
                  const puesto = getPacienteEquipoPuesto(item);
                  const area = getPacienteEquipoArea(item);
                  const eligible = isPacienteEquipoClinicallyEligible(item);

                  return (
                    <button
                      type="button"
                      key={getIdentity(item)}
                      className="suggestionItem"
                      onClick={() =>
                        assignMutation.mutate(item?.empleado_id ?? item?.id)
                      }
                      disabled={isMutating}
                    >
                      <div className="suggestionHeader">
                        <strong>{getProfessionalName(item) || "Profesional"}</strong>
                        <span className={`badge ${eligible ? "enabled" : "disabled"}`}>
                          {eligible ? "Otorga permisos clinicos" : "Sin permisos clinicos"}
                        </span>
                      </div>
                      <span>{safeString(puesto?.name).trim() || "Sin puesto"}</span>
                      <small>{safeString(area?.name).trim() || "Sin area"}</small>
                    </button>
                  );
                })
              ) : debouncedSearch.length >= 2 ? (
                <div className="suggestionItem muted">Sin coincidencias</div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : (
        <ReadonlyBanner>
          {String(ingreso?.status ?? "").toLowerCase() === "admitted"
            ? "No tienes permisos para modificar el equipo tratante de esta internacion."
            : "Internacion cerrada: el equipo tratante esta en modo solo lectura."}
        </ReadonlyBanner>
      )}

      {isMutating ? <Spinner1 /> : null}

      {(rows ?? []).length ? (
        <List>
          {(rows ?? []).map((item) => {
            const puesto = getPacienteEquipoPuesto(item);
            const area = getPacienteEquipoArea(item);
            const eligible = isPacienteEquipoClinicallyEligible(item);
            const isActive = isPacienteEquipoAssignmentActive(item);

            return (
              <article key={item.id} className="memberCard">
                <div className="memberBody">
                  <div className="memberHeader">
                    <strong>{getProfessionalName(item) || "Profesional"}</strong>
                    <div className="badgeGroup">
                      <span className={`badge ${isActive ? "active" : "inactive"}`}>
                        {isActive ? "Activo" : "Finalizado"}
                      </span>
                      <span className={`badge ${eligible ? "enabled" : "disabled"}`}>
                        {eligible ? "Clinico" : "No clinico"}
                      </span>
                    </div>
                  </div>
                  <p>{safeString(puesto?.name).trim() || "Sin puesto"}</p>
                  <small>
                    {safeString(area?.name).trim() || "Sin area"}
                    {item?.empleado?.professional_number
                      ? ` · Matricula ${item.empleado.professional_number}`
                      : item?.empleado?.employee_id_number
                        ? ` · Legajo ${item.empleado.employee_id_number}`
                        : ""}
                  </small>
                  <div className="datesRow">
                    <span>Desde: {formatDate(item?.start_date ?? item?.created_at)}</span>
                    <span>Hasta: {formatDate(item?.end_date)}</span>
                  </div>
                </div>

                {canManageTeam ? (
                  isActive ? (
                    <Btn1
                      tipo="button"
                      titulo="Finalizar"
                      bgcolor="var(--bg-surface-muted)"
                      icono={<v.iconocerrar />}
                      funcion={() => handleFinishAssignment(item)}
                      disabled={isMutating}
                    />
                  ) : (
                    <Btn1
                      tipo="button"
                      titulo="Reactivar"
                      bgcolor="var(--bg-accent-soft-strong)"
                      icono={<v.iconoagregar />}
                      funcion={() => reopenMutation.mutate(item.id)}
                      disabled={isMutating}
                    />
                  )
                ) : null}
              </article>
            );
          })}
        </List>
      ) : (
        <EmptyState>Sin profesionales asignados para esta internacion.</EmptyState>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  gap: 14px;

  .badge {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .badge.active,
  .badge.enabled {
    background: rgba(52, 125, 96, 0.14);
    color: #2d7a60;
  }

  .badge.inactive,
  .badge.disabled {
    background: rgba(168, 138, 75, 0.14);
    color: #8b6b2d;
  }

  .searchPanel {
    display: grid;
    gap: 10px;
  }

  .suggestions {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 16px;
    background: ${({ theme }) => theme.bg};
    overflow: hidden;
    box-shadow: var(--shadow-elev-1);
  }

  .suggestionItem {
    width: 100%;
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    background: transparent;
    color: ${({ theme }) => theme.text};
    text-align: left;
    padding: 14px 16px;
    display: grid;
    gap: 4px;
    cursor: pointer;
  }

  .suggestionItem:last-child {
    border-bottom: none;
  }

  .suggestionItem.muted {
    cursor: default;
    color: ${({ theme }) => theme.textsecundary};
  }

  .suggestionHeader {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
`;

const List = styled.div`
  display: grid;
  gap: 10px;

  .badge {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .badge.active,
  .badge.enabled {
    background: rgba(52, 125, 96, 0.14);
    color: #2d7a60;
  }

  .badge.inactive,
  .badge.disabled {
    background: rgba(168, 138, 75, 0.14);
    color: #8b6b2d;
  }

  .memberCard {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    padding: 16px;
    border-radius: 18px;
    background: ${({ theme }) => theme.bg};
    border: 1px solid ${({ theme }) => theme.color2};
    box-shadow: var(--shadow-elev-1);
  }

  .memberBody {
    min-width: 0;
    display: grid;
    gap: 6px;
  }

  .memberHeader {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .badgeGroup {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  strong,
  p,
  small,
  span {
    margin: 0;
  }

  p {
    color: ${({ theme }) => theme.text};
    font-weight: 600;
  }

  small,
  .datesRow {
    color: ${({ theme }) => theme.textsecundary};
  }

  .datesRow {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 0.88rem;
  }

  @media ${DeviceMax.mobile} {
    .memberCard {
      display: grid;
    }
  }
`;

const EmptyState = styled.div`
  border: 1px dashed ${({ theme }) => theme.color2};
  border-radius: 16px;
  padding: 18px;
  color: ${({ theme }) => theme.textsecundary};
  background: ${({ theme }) => theme.bg};
`;

const ReadonlyBanner = styled.div`
  border-radius: 16px;
  padding: 14px 16px;
  background: rgba(0, 0, 0, 0.04);
  color: ${({ theme }) => theme.textsecundary};
`;
