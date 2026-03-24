import styled from "styled-components";
import {
  AccionTabla,
  resolvePerfilDisplayName,
  resolvePerfilRoleDisplay,
} from "../../../index";
import {
  formatPacienteIndicacionScheduleLabel,
  hydratePacienteIndicacionRecord,
  INDICACION_SCHEDULE_OPTIONS,
} from "../../../utils/pacienteIndicaciones";
import { DeviceMax } from "../../../styles/breakpoints";
import { v } from "../../../styles/variables";

const formatDateLabel = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return String(value);
  const pad = (input) => String(input).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
};

const formatSectionText = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized || "Sin contenido.";
};

const getProfessionalLabel = (row) => {
  const displayName = resolvePerfilDisplayName(row?.creador, row?.created_by);
  const role = resolvePerfilRoleDisplay(row?.creador);

  if (displayName === "-" && role === "-") return "-";
  if (role === "-") return displayName;
  if (displayName === "-") return role;
  return `${displayName} - ${role}`;
};

const getScheduleLabels = (row) => {
  const labels = (row?.schedules ?? []).map((schedule) =>
    formatPacienteIndicacionScheduleLabel(schedule),
  );
  return labels.length ? labels : ["Sin horario"];
};

export function TablaPacienteIndicaciones({
  data,
  onEdit,
  canEditRow = () => false,
}) {
  const safeData = Array.isArray(data) ? data : [];
  const hydratedRows = safeData.map((row) => hydratePacienteIndicacionRecord(row));

  if (data == null) return null;

  return (
    <Container>
      {hydratedRows.map((indicacion) => {
        const indicationRows = indicacion?.indication_rows ?? [];
        const hasObs = Boolean(indicacion?.indication_obs);
        const hasRef = Boolean(indicacion?.indication_ref);

        return (
          <article className="sheetCard" key={indicacion.id}>
            <header className="sheetHeader">
              <div className="metaGrid">
                <div className="metaItem">
                  <span className="label">Indica Dr/a</span>
                  <strong>{getProfessionalLabel(indicacion)}</strong>
                </div>
                <div className="metaItem">
                  <span className="label">Fecha</span>
                  <strong>{formatDateLabel(indicacion.indication_date)}</strong>
                </div>
              </div>
              {canEditRow(indicacion) ? (
                <div className="headerActions">
                  <AccionTabla
                    funcion={() => onEdit?.(indicacion)}
                    fontSize="18px"
                    color="#7d7d7d"
                    icono={<v.iconeditarTabla />}
                  />
                </div>
              ) : null}
            </header>

            <div className="gridScroll">
              <table className="scheduleTable">
                <thead>
                  <tr>
                    <th>Indicaciones</th>
                    {INDICACION_SCHEDULE_OPTIONS.map((option) => (
                      <th key={option.key}>{option.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {indicationRows.length ? (
                    indicationRows.map((row) => (
                      <tr key={`${indicacion.id}-${row.local_id}`}>
                        <td data-label="Indicaciones" className="descriptionCell">
                          {row.description}
                        </td>
                        {INDICACION_SCHEDULE_OPTIONS.map((option) => {
                          const checked = row.schedules.includes(option.key);
                          return (
                            <td
                              key={`${row.local_id}-${option.key}`}
                              data-label={formatPacienteIndicacionScheduleLabel(
                                option.key,
                              )}
                              className={`scheduleCell${checked ? " checked" : ""}`}
                            >
                              <span className="mark">{checked ? "Si" : "-"}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="emptyGrid"
                        colSpan={INDICACION_SCHEDULE_OPTIONS.length + 1}
                      >
                        Sin indicaciones cargadas en la grilla.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobileGridCards">
              {indicationRows.length ? (
                indicationRows.map((row) => (
                  <article
                    className="indicationRowCard"
                    key={`mobile-${indicacion.id}-${row.local_id}`}
                  >
                    <div className="cardRow">
                      <span className="label">Indicacion</span>
                      <strong>{row.description}</strong>
                    </div>
                    <div className="cardRow">
                      <span className="label">Horarios</span>
                      <div className="schedulePills">
                        {getScheduleLabels(row).map((label) => (
                          <span key={`${row.local_id}-${label}`} className="pill">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="emptyMobileCard">
                  Sin indicaciones cargadas en la grilla.
                </div>
              )}
            </div>

            {(hasObs || hasRef) && (
              <div className="extraSections">
                <section className="extraCard">
                  <span className="label">Otras indicaciones</span>
                  <p>{formatSectionText(indicacion.indication_obs)}</p>
                </section>
                <section className="extraCard">
                  <span className="label">Refuerzos</span>
                  <p>{formatSectionText(indicacion.indication_ref)}</p>
                </section>
              </div>
            )}
          </article>
        );
      })}
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  gap: 14px;

  .sheetCard {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 18px;
    background: ${({ theme }) => theme.bg};
    box-shadow: var(--shadow-elev-1);
    padding: 16px;
    display: grid;
    gap: 14px;
  }

  .sheetHeader {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .metaGrid {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(2, minmax(220px, 1fr));
    flex: 1 1 460px;
  }

  .metaItem {
    display: grid;
    gap: 4px;
  }

  .label {
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .headerActions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .gridScroll {
    overflow-x: auto;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
  }

  .mobileGridCards {
    display: none;
  }

  .scheduleTable {
    width: 100%;
    min-width: 720px;
    border-collapse: collapse;

    th,
    td {
      padding: 10px 12px;
      border-bottom: 1px solid ${({ theme }) => theme.color2};
      text-align: center;
      vertical-align: middle;
    }

    thead th {
      background: var(--bg-surface-muted);
      color: ${({ theme }) => theme.textsecundary};
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }
  }

  .descriptionCell {
    min-width: 320px;
    text-align: left;
    font-weight: 500;
    white-space: pre-wrap;
  }

  .scheduleCell .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    border-radius: 999px;
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.82rem;
    font-weight: 700;
  }

  .scheduleCell.checked .mark {
    background: var(--bg-accent-soft-strong);
    color: ${({ theme }) => theme.color1};
  }

  .emptyGrid {
    text-align: center;
    color: ${({ theme }) => theme.textsecundary};
  }

  .extraSections {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .extraCard {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    padding: 12px 14px;
    display: grid;
    gap: 8px;
    background: ${({ theme }) => theme.bgtotal};
  }

  .extraCard p {
    margin: 0;
    white-space: pre-wrap;
    line-height: 1.45;
  }

  @media ${DeviceMax.mobile} {
    .sheetCard {
      padding: 14px;
    }

    .metaGrid,
    .extraSections {
      grid-template-columns: 1fr;
    }

    .gridScroll {
      display: none;
    }

    .mobileGridCards {
      display: grid;
      gap: 10px;
    }

    .indicationRowCard,
    .emptyMobileCard {
      border: 1px solid ${({ theme }) => theme.color2};
      border-radius: 14px;
      background: ${({ theme }) => theme.bgtotal};
      padding: 12px 14px;
    }

    .indicationRowCard {
      display: grid;
      gap: 10px;
    }

    .cardRow {
      display: grid;
      gap: 6px;
    }

    .schedulePills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .pill {
      border-radius: 999px;
      padding: 6px 10px;
      background: var(--bg-accent-soft);
      color: ${({ theme }) => theme.color1};
      font-size: 0.82rem;
      font-weight: 700;
    }

    .emptyMobileCard {
      color: ${({ theme }) => theme.textsecundary};
    }
  }
`;
