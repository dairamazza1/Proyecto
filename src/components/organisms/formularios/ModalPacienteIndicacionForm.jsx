import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  Btn1,
  InputText,
  Spinner1,
  resolvePerfilDisplayName,
  resolvePerfilRoleDisplay,
  usePermissions,
} from "../../../index";
import {
  insertPacienteIndicacion,
  updatePacienteIndicacion,
} from "../../../supabase/crudPacientes";
import {
  argentinaDateTimeInputToIso,
  getArgentinaCurrentDateTimeInput,
  isoToArgentinaDateTimeInput,
} from "../../../utils/argentinaDateTime";
import {
  buildPacienteIndicacionDescription,
  createPacienteIndicacionFormRow,
  hasPacienteIndicacionMeaningfulContent,
  hydratePacienteIndicacionRecord,
  INDICACION_DOSE_OPTIONS,
  INDICACION_SCHEDULE_OPTIONS,
} from "../../../utils/pacienteIndicaciones";
import { DeviceMax } from "../../../styles/breakpoints";
import { v } from "../../../styles/variables";

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value);

const isTruthyFieldValue = (value) =>
  value === true || value === "true" || value === 1 || value === "1";

const SCHEDULE_FIELD_BY_KEY = {
  "08:00": "dose_08_00",
  "12:00": "dose_12_00",
  "16:00": "dose_16_00",
  "20:00": "dose_20_00",
};

const LEGACY_SCHEDULE_FIELD_BY_KEY = {
  "08:00": "legacy_08_00",
  "12:00": "legacy_12_00",
  "16:00": "legacy_16_00",
  "20:00": "legacy_20_00",
};

const mapIndicacionRowToFormValues = (row) => ({
  local_id: row?.local_id ?? "",
  description: safeString(row?.description),
  dose_08_00: safeString(row?.schedule_doses?.["08:00"]),
  dose_12_00: safeString(row?.schedule_doses?.["12:00"]),
  dose_16_00: safeString(row?.schedule_doses?.["16:00"]),
  dose_20_00: safeString(row?.schedule_doses?.["20:00"]),
  legacy_08_00:
    !row?.schedule_doses?.["08:00"] && (row?.schedules ?? []).includes("08:00"),
  legacy_12_00:
    !row?.schedule_doses?.["12:00"] && (row?.schedules ?? []).includes("12:00"),
  legacy_16_00:
    !row?.schedule_doses?.["16:00"] && (row?.schedules ?? []).includes("16:00"),
  legacy_20_00:
    !row?.schedule_doses?.["20:00"] && (row?.schedules ?? []).includes("20:00"),
});

const createEmptyFormRow = () =>
  mapIndicacionRowToFormValues(createPacienteIndicacionFormRow());

const mapFormRowsToIndicacionRows = (rows = []) =>
  (rows ?? []).map((row) =>
    {
      const scheduleDoses = INDICACION_SCHEDULE_OPTIONS.reduce((acc, option) => {
        const doseValue = safeString(row?.[SCHEDULE_FIELD_BY_KEY[option.key]]).trim();
        if (doseValue) {
          acc[option.key] = doseValue;
        }
        return acc;
      }, {});

      const legacySchedules = INDICACION_SCHEDULE_OPTIONS.filter(
        (option) =>
          !scheduleDoses[option.key] &&
          isTruthyFieldValue(row?.[LEGACY_SCHEDULE_FIELD_BY_KEY[option.key]]),
      ).map((option) => option.key);

      return createPacienteIndicacionFormRow({
        local_id: row?.local_id,
        description: row?.description,
        schedule_doses: scheduleDoses,
        schedules: legacySchedules,
      });
    },
  );

const buildFormValues = (indicacionPreselected) => {
  const hydrated = indicacionPreselected
    ? hydratePacienteIndicacionRecord(indicacionPreselected)
    : null;
  const indicationRows = hydrated?.indication_rows?.length
    ? hydrated.indication_rows
    : [createPacienteIndicacionFormRow()];

  return {
    indication_at:
      isoToArgentinaDateTimeInput(hydrated?.indication_date) ||
      getArgentinaCurrentDateTimeInput(),
    indication_obs: safeString(hydrated?.indication_obs),
    indication_ref: safeString(hydrated?.indication_ref),
    rows: indicationRows.map(mapIndicacionRowToFormValues),
  };
};

const getProfessionalLabel = (perfil) => {
  const displayName = resolvePerfilDisplayName(perfil, perfil?.id);
  const role = resolvePerfilRoleDisplay(perfil);

  if (displayName === "-" && role === "-") return "-";
  if (role === "-") return displayName;
  if (displayName === "-") return role;
  return `${displayName} - ${role}`;
};

export function ModalPacienteIndicacionForm({
  pacienteId,
  ingresoId,
  indicacionPreselected = null,
  onClose,
  queryKey,
}) {
  const queryClient = useQueryClient();
  const { profile } = usePermissions();
  const isEditMode = Boolean(indicacionPreselected?.id);
  const [rowValidationErrors, setRowValidationErrors] = useState([]);
  const currentDateTimeInput = getArgentinaCurrentDateTimeInput();
  const formValues = useMemo(
    () => buildFormValues(indicacionPreselected),
    [indicacionPreselected],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: formValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rows",
  });

  useEffect(() => {
    reset(formValues);
    setRowValidationErrors([]);
  }, [formValues, reset]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      if (!pacienteId) {
        throw new Error(
          "No se encontro el paciente para registrar la indicacion.",
        );
      }
      if (!ingresoId) {
        throw new Error(
          "Seleccione un ingreso activo para registrar indicaciones.",
        );
      }

      const indicationAtIso = argentinaDateTimeInputToIso(data.indication_at);
      if (!indicationAtIso) {
        throw new Error("Debe indicar una fecha y hora validas.");
      }

      const normalizedRows = mapFormRowsToIndicacionRows(data.rows);
      const payload = {
        indication_at: indicationAtIso,
        description: buildPacienteIndicacionDescription(normalizedRows),
        indication_obs: safeString(data.indication_obs).trim() || null,
        indication_ref: safeString(data.indication_ref).trim() || null,
        evolucion_id: indicacionPreselected?.evolucion_id ?? null,
      };

      if (isEditMode) {
        return updatePacienteIndicacion(indicacionPreselected.id, payload);
      }

      return insertPacienteIndicacion({
        paciente_id: pacienteId,
        ingreso_id: ingresoId,
        created_by: profile?.id ?? null,
        ...payload,
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: isEditMode ? "Indicacion actualizada" : "Indicacion registrada",
        text: isEditMode
          ? "La hoja de indicaciones fue actualizada correctamente."
          : "La hoja de indicaciones fue guardada correctamente.",
      });

      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
        queryClient.refetchQueries({
          queryKey,
          type: "active",
          exact: true,
        });
      }

      onClose?.();
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text:
          error?.message ||
          (isEditMode
            ? "No se pudo actualizar la indicacion."
            : "No se pudo guardar la indicacion."),
      });
    },
  });

  const onSubmit = (data) => {
    const normalizedRows = mapFormRowsToIndicacionRows(data.rows);
    const nextRowErrors = normalizedRows.map((row) => {
      const hasDescription = Boolean(row.description);
      const hasDoseSelections = Boolean(
        Object.keys(row.schedule_doses ?? {}).length || row.schedules.length,
      );

      if (!hasDescription && !hasDoseSelections) return "";
      if (!hasDescription) return "Indique la descripcion.";
      return "";
    });

    if (nextRowErrors.some(Boolean)) {
      setRowValidationErrors(nextRowErrors);
      return;
    }

    if (
      !hasPacienteIndicacionMeaningfulContent({
        rows: normalizedRows,
        indicationObs: data.indication_obs,
        indicationRef: data.indication_ref,
      })
    ) {
      Swal.fire({
        icon: "info",
        title: "Sin contenido",
        text: "Debe completar al menos una indicacion, otras indicaciones o refuerzos.",
      });
      return;
    }

    setRowValidationErrors([]);
    mutate(data);
  };

  if (isPending) {
    return <Spinner1 />;
  }

  return (
    <Overlay
      onClick={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <Modal onClick={(event) => event.stopPropagation()}>
        <div className="headers">
          <section>
            <h1>
              {isEditMode ? "Editar indicaciones" : "Agregar indicaciones"}
            </h1>
            <small>
              Hoja de indicaciones por horario para la internacion seleccionada.
            </small>
          </section>
          <section>
            <span onClick={() => onClose?.()}>x</span>
          </section>
        </div>

        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          <div className="headerFields">
            <article className="full professionalPreview">
              <span className="previewLabel">Indica Dr/a</span>
              <strong>{getProfessionalLabel(profile)}</strong>
            </article>
            <article>
              <InputText icono={<v.iconoCalendario />}>
                <input
                  className="form__field"
                  type="datetime-local"
                  max={currentDateTimeInput}
                  {...register("indication_at", {
                    required: "Campo requerido",
                    validate: (value) => {
                      const normalized = safeString(value).trim();
                      if (!normalized) return true;
                      if (normalized > currentDateTimeInput) {
                        return "La fecha y hora no puede ser mayor al momento actual.";
                      }
                      return true;
                    },
                  })}
                />
                <label className="form__label">Fecha</label>
                {errors.indication_at?.message ? (
                  <p>{errors.indication_at.message}</p>
                ) : null}
              </InputText>
            </article>
          </div>

          <section className="gridSection">
            <div className="sectionHeader">
              <div>
                <h2>Indicaciones</h2>
                <small>Seleccione una dosis opcional para cada horario.</small>
              </div>
              <Btn1
                tipo="button"
                icono={<v.iconoagregar />}
                titulo="Agregar fila"
                bgcolor="var(--bg-accent-soft-strong)"
                funcion={() => {
                  append(createEmptyFormRow());
                  setRowValidationErrors([]);
                }}
              />
            </div>

            <div className="gridScroll">
              <table className="scheduleTable">
                <thead>
                  <tr>
                    <th>Indicaciones</th>
                    {INDICACION_SCHEDULE_OPTIONS.map((option) => (
                      <th key={option.key}>{option.label}</th>
                    ))}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="descriptionCell">
                        <input
                          type="hidden"
                          {...register(`rows.${index}.local_id`)}
                        />
                        {INDICACION_SCHEDULE_OPTIONS.map((option) => (
                          <input
                            key={`legacy-${field.id}-${option.key}`}
                            type="hidden"
                            {...register(
                              `rows.${index}.${LEGACY_SCHEDULE_FIELD_BY_KEY[option.key]}`,
                            )}
                          />
                        ))}
                        <textarea
                          className="descriptionInput"
                          rows={2}
                          placeholder="Ej. Clonazepam 0.5 mg VO"
                          {...register(`rows.${index}.description`)}
                        />
                        {rowValidationErrors[index] ? (
                          <p className="rowError">
                            {rowValidationErrors[index]}
                          </p>
                        ) : null}
                      </td>
                      {INDICACION_SCHEDULE_OPTIONS.map((option) => (
                        <td key={option.key} className="doseCell">
                          <select
                            className="doseSelect"
                            {...register(
                              `rows.${index}.${SCHEDULE_FIELD_BY_KEY[option.key]}`,
                            )}
                          >
                            <option value="">-</option>
                            {INDICACION_DOSE_OPTIONS.map((doseOption) => (
                              <option key={`${option.key}-${doseOption}`} value={doseOption}>
                                {doseOption}
                              </option>
                            ))}
                          </select>
                        </td>
                      ))}
                      <td className="actionsCell">
                        <button
                          type="button"
                          className="removeRowButton"
                          onClick={() => {
                            remove(index);
                            setRowValidationErrors((prev) =>
                              prev.filter(
                                (_, errorIndex) => errorIndex !== index,
                              ),
                            );
                          }}
                          disabled={fields.length === 1}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="extraFields">
            <article className="full">
              <InputText icono={<v.iconoImportante />}>
                <textarea
                  className="form__field textarea"
                  placeholder="Observaciones adicionales"
                  rows={4}
                  {...register("indication_obs")}
                />
                <label className="form__label">Otras indicaciones</label>
              </InputText>
            </article>

            <article className="full">
              <InputText icono={<v.iconoImportante />}>
                <textarea
                  className="form__field textarea"
                  placeholder="Refuerzos"
                  rows={4}
                  {...register("indication_ref")}
                />
                <label className="form__label">Refuerzos</label>
              </InputText>
            </article>
          </section>

          <div className="acciones">
            <Btn1
              icono={<v.iconocerrar />}
              titulo="Cancelar"
              bgcolor="var(--bg-surface-muted)"
              funcion={() => onClose?.()}
              tipo="button"
            />
            <Btn1
              icono={<v.iconoguardar />}
              titulo={isEditMode ? "Guardar cambios" : "Guardar"}
              bgcolor={v.colorPrincipal}
            />
          </div>
        </form>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: var(--overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;

  @media ${DeviceMax.mobile} {
    padding: 16px;
    align-items: flex-start;
    overflow-y: auto;
  }
`;

const Modal = styled.div`
  width: min(100%, 1100px);
  max-height: min(92dvh, 960px);
  overflow: auto;
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  box-shadow: var(--shadow-elev-2);
  padding: 22px 22px 18px;
  display: grid;
  gap: 18px;

  .headers {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;

    h1 {
      margin: 0 0 4px;
      font-size: 1.2rem;
    }

    small {
      color: ${({ theme }) => theme.textsecundary};
    }

    span {
      cursor: pointer;
      font-size: 1.4rem;
      line-height: 1;
    }
  }

  .formulario,
  .headerFields,
  .extraFields {
    display: grid;
    gap: 16px;
  }

  .headerFields {
    grid-template-columns: minmax(0, 1.4fr) minmax(240px, 0.8fr);
    align-items: end;
  }

  article.full {
    grid-column: 1 / -1;
  }

  .professionalPreview {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    padding: 14px 16px;
    background: ${({ theme }) => theme.bgtotal};
    display: grid;
    gap: 4px;
  }

  .previewLabel {
    font-size: 0.82rem;
    color: ${({ theme }) => theme.textsecundary};
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .gridSection {
    display: grid;
    gap: 12px;
  }

  .sectionHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;

    h2 {
      margin: 0 0 4px;
      font-size: 1rem;
    }

    small {
      color: ${({ theme }) => theme.textsecundary};
    }
  }

  .gridScroll {
    overflow-x: auto;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 16px;
  }

  .scheduleTable {
    width: 100%;
    border-collapse: collapse;
    min-width: 760px;

    th,
    td {
      border-bottom: 1px solid ${({ theme }) => theme.color2};
      padding: 10px 12px;
      vertical-align: top;
    }

    thead th {
      background: var(--bg-surface-muted);
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      color: ${({ theme }) => theme.textsecundary};
      text-align: center;
    }

    thead th:first-child,
    tbody td:first-child {
      text-align: left;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }
  }

  .descriptionCell {
    min-width: 320px;
  }

  .descriptionInput {
    width: 100%;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    padding: 10px 12px;
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    resize: vertical;
    min-height: 76px;
    font: inherit;
  }

  .doseCell,
  .actionsCell {
    text-align: center;
    vertical-align: middle;
  }

  .doseSelect {
    width: 100%;
    min-width: 82px;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 10px;
    padding: 8px 10px;
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    font: inherit;
  }

  .removeRowButton {
    border: none;
    background: transparent;
    color: var(--color-danger);
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }

  .removeRowButton:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .rowError {
    margin: 8px 0 0;
    color: var(--color-danger);
    font-size: 0.82rem;
  }

  .textarea {
    min-height: 120px;
    resize: vertical;
  }

  .acciones {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  @media ${DeviceMax.mobile} {
    width: 100%;
    max-height: none;
    padding: 18px 16px;

    .headerFields {
      grid-template-columns: 1fr;
    }
  }
`;
