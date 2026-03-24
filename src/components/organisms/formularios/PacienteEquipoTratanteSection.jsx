import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { Btn1 } from "../../molecules/Btn1";
import { InputText } from "./inputText";
import { searchPacienteEquipoProfesionales } from "../../../supabase/crudPacientes";
import {
  dedupePacienteEquipoProfessionals,
  getPacienteEquipoArea,
  getPacienteEquipoPuesto,
  isPacienteEquipoClinicallyEligible,
} from "../../../utils/pacienteEquipoTratante";
import { DeviceMax } from "../../../styles/breakpoints";
import { v } from "../../../styles/variables";

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value);

const buildSearchLabel = (item) =>
  [item?.first_name, item?.last_name].filter(Boolean).join(" ").trim();

const getItemIdentity = (item) =>
  String(item?.empleado_id ?? item?.id ?? "").trim();

export function PacienteEquipoTratanteSection({
  empresaId,
  value = [],
  onChange,
  disabled = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["pacienteEquipoProfesionalesSearch", empresaId, debouncedSearch],
    queryFn: () =>
      searchPacienteEquipoProfesionales({
        empresaId,
        term: debouncedSearch,
        limit: 12,
      }),
    enabled: Boolean(empresaId) && debouncedSearch.length >= 2 && !disabled,
    refetchOnWindowFocus: false,
  });

  const selectedIds = useMemo(
    () =>
      new Set(
        (value ?? [])
          .map((item) => getItemIdentity(item))
          .filter(Boolean),
      ),
    [value],
  );

  const visibleSearchResults = useMemo(
    () =>
      (searchResults ?? []).filter(
        (item) => !selectedIds.has(getItemIdentity(item)),
      ),
    [searchResults, selectedIds],
  );

  const handleAdd = (item) => {
    if (disabled || typeof onChange !== "function") return;
    const nextValue = dedupePacienteEquipoProfessionals([
      ...(value ?? []),
      {
        ...item,
        empleado_id: item?.empleado_id ?? item?.id ?? null,
      },
    ]);

    onChange(nextValue);
    setSearchTerm("");
    setDebouncedSearch("");
  };

  const handleRemove = (empleadoId) => {
    if (disabled || typeof onChange !== "function") return;
    onChange(
      (value ?? []).filter(
        (item) => getItemIdentity(item) !== String(empleadoId),
      ),
    );
  };

  return (
    <Container>
      <div className="header">
        <div>
          <h3>Equipo tratante</h3>
          <p>
            Busca profesionales activos de la empresa y asignalos a esta
            internacion.
          </p>
        </div>
      </div>

      <div className="searchBox">
        <InputText icono={<v.iconoBuscar />}>
          <input
            className="form__field"
            type="search"
            placeholder="Buscar profesional"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            disabled={disabled}
          />
          <label className="form__label">
            Buscar profesional (nombre, legajo o matricula)
          </label>
        </InputText>

        {!!searchTerm.trim() && !disabled ? (
          <div className="suggestions">
            {isLoading ? (
              <div className="suggestionItem muted">Buscando profesionales...</div>
            ) : visibleSearchResults.length ? (
              visibleSearchResults.map((item) => {
                const puesto = getPacienteEquipoPuesto(item);
                const area = getPacienteEquipoArea(item);
                const isEligible = isPacienteEquipoClinicallyEligible(item);

                return (
                  <button
                    type="button"
                    key={getItemIdentity(item)}
                    className="suggestionItem"
                    onClick={() => handleAdd(item)}
                  >
                    <div className="suggestionHeader">
                      <strong>{buildSearchLabel(item) || "Profesional"}</strong>
                      <span className={`eligibility ${isEligible ? "enabled" : "disabled"}`}>
                        {isEligible ? "Otorga permisos clinicos" : "Sin permisos clinicos"}
                      </span>
                    </div>
                    <span>{safeString(puesto?.name).trim() || "Sin puesto"}</span>
                    <small>
                      {safeString(area?.name).trim() || "Sin area"}
                      {item?.professional_number
                        ? ` · Matricula ${item.professional_number}`
                        : item?.employee_id_number
                          ? ` · Legajo ${item.employee_id_number}`
                          : ""}
                    </small>
                  </button>
                );
              })
            ) : debouncedSearch.length >= 2 ? (
              <div className="suggestionItem muted">Sin coincidencias</div>
            ) : null}
          </div>
        ) : null}
      </div>

      {(value ?? []).length ? (
        <AssignedList>
          {(value ?? []).map((item) => {
            const puesto = getPacienteEquipoPuesto(item);
            const area = getPacienteEquipoArea(item);
            const isEligible = isPacienteEquipoClinicallyEligible(item);
            const identity = getItemIdentity(item);

            return (
              <article key={identity} className="memberCard">
                <div className="memberBody">
                  <div className="memberHeader">
                    <strong>{buildSearchLabel(item) || "Profesional"}</strong>
                    <span className={`eligibility ${isEligible ? "enabled" : "disabled"}`}>
                      {isEligible ? "Clinico" : "No clinico"}
                    </span>
                  </div>
                  <p>{safeString(puesto?.name).trim() || "Sin puesto"}</p>
                  <small>
                    {safeString(area?.name).trim() || "Sin area"}
                    {item?.professional_number
                      ? ` · Matricula ${item.professional_number}`
                      : item?.employee_id_number
                        ? ` · Legajo ${item.employee_id_number}`
                        : ""}
                  </small>
                </div>
                <Btn1
                  tipo="button"
                  titulo="Quitar"
                  bgcolor="var(--bg-surface-muted)"
                  icono={<v.iconocerrar />}
                  funcion={() => handleRemove(identity)}
                  disabled={disabled}
                />
              </article>
            );
          })}
        </AssignedList>
      ) : (
        <EmptyState>
          Todavia no hay profesionales seleccionados para esta internacion.
        </EmptyState>
      )}
    </Container>
  );
}

const Container = styled.section`
  display: grid;
  gap: 12px;

  .header {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: ${({ theme }) => theme.text};
  }

  p {
    margin: 4px 0 0;
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.92rem;
  }

  .searchBox {
    position: relative;
  }

  .suggestions {
    position: relative;
    z-index: 2;
    margin-top: 10px;
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

  .eligibility {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .eligibility.enabled {
    background: rgba(52, 125, 96, 0.14);
    color: #2d7a60;
  }

  .eligibility.disabled {
    background: rgba(168, 138, 75, 0.14);
    color: #8b6b2d;
  }
`;

const AssignedList = styled.div`
  display: grid;
  gap: 10px;

  .memberCard {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bg};
    box-shadow: var(--shadow-elev-1);
  }

  .memberBody {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .memberHeader {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  strong,
  p,
  small {
    margin: 0;
  }

  p {
    color: ${({ theme }) => theme.text};
    font-weight: 600;
  }

  small {
    color: ${({ theme }) => theme.textsecundary};
  }

  .eligibility {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .eligibility.enabled {
    background: rgba(52, 125, 96, 0.14);
    color: #2d7a60;
  }

  .eligibility.disabled {
    background: rgba(168, 138, 75, 0.14);
    color: #8b6b2d;
  }

  @media ${DeviceMax.mobile} {
    .memberCard {
      display: grid;
      justify-items: stretch;
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
