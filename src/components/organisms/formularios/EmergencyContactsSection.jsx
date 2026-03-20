import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import styled from "styled-components";
import { Btn1 } from "../../molecules/Btn1";
import { Device, DeviceMax } from "../../../styles/breakpoints";
import { v as V } from "../../../styles/variables";
import { InputText } from "./inputText";
import {
  createEmptyEmergencyContact,
  EMERGENCY_DOC_TYPE_OPTIONS,
  EMERGENCY_VINCULO_OPTIONS,
} from "../../../utils/contactosEmergencia";

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const getRowFieldError = (errors, fieldArrayName, index, fieldName) =>
  errors?.[fieldArrayName]?.[index]?.[fieldName]?.message || null;

export function EmergencyContactsSection({
  control,
  register,
  errors,
  fields,
  append,
  remove,
  name = "emergency_contacts",
  variant = "empleado",
  helperText = "",
  showDocFields,
}) {
  const rows = useWatch({ control, name }) ?? [];
  const shouldShowDocFields = useMemo(
    () => (typeof showDocFields === "boolean" ? showDocFields : variant === "paciente"),
    [showDocFields, variant]
  );

  const rowHasData = (index) => {
    const row = rows?.[index] ?? {};
    return Boolean(
      safeString(row?.name) ||
        safeString(row?.telephone) ||
        safeString(row?.vinculo) ||
        (shouldShowDocFields && safeString(row?.doc_number))
    );
  };

  const requiredIfPopulated = (index, fieldLabel) => (value) => {
    if (!rowHasData(index)) return true;
    return safeString(value) ? true : `${fieldLabel} requerido`;
  };

  return (
    <Container>
      {helperText ? <p className="helper">{helperText}</p> : null}

      <div className="contactList">
        {fields.map((field, index) => (
          <div key={field.id} className="contactCard">
            {/* NOTE: Use watched values (rows) for dynamic labels/placeholders. */}
            {(() => {
              const row = rows?.[index] ?? {};
              const docTypeValue = safeString(row?.doc_type) || "DNI";
              const docNumberLabel =
                docTypeValue === "DNI" ? "DNI" : "N° documento";

              return (
                <>
                  <div className="contactHeader">
                    <strong>Contacto {index + 1}</strong>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        className="linkButton danger"
                        onClick={() => remove(index)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div className="fieldsGrid">
                    <article className="full">
                      <InputText icono={<V.iconoUser />}>
                        <input
                          className="form__field"
                          type="text"
                          placeholder="Nombre del contacto"
                          {...register(`${name}.${index}.name`, {
                            validate: requiredIfPopulated(index, "Nombre"),
                          })}
                        />
                        <label className="form__label">Nombre</label>
                        {getRowFieldError(errors, name, index, "name") && (
                          <p>{getRowFieldError(errors, name, index, "name")}</p>
                        )}
                      </InputText>
                    </article>

                    <article>
                      <InputText icono={<V.iconoTelephone />}>
                        <input
                          className="form__field"
                          type="text"
                          placeholder="Telefono"
                          {...register(`${name}.${index}.telephone`, {
                            validate: requiredIfPopulated(index, "Telefono"),
                          })}
                        />
                        <label className="form__label">Telefono</label>
                        {getRowFieldError(errors, name, index, "telephone") && (
                          <p>
                            {getRowFieldError(errors, name, index, "telephone")}
                          </p>
                        )}
                      </InputText>
                    </article>

                    <article>
                      <InputText icono={<V.iconoUser />}>
                        <select
                          className="form__field"
                          {...register(`${name}.${index}.vinculo`, {
                            validate: requiredIfPopulated(index, "Vinculo"),
                          })}
                        >
                          <option value="">Seleccionar vinculo</option>
                          {EMERGENCY_VINCULO_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <label className="form__label">Vinculo</label>
                        {getRowFieldError(errors, name, index, "vinculo") && (
                          <p>
                            {getRowFieldError(errors, name, index, "vinculo")}
                          </p>
                    )}
                      </InputText>
                    </article>

                    {shouldShowDocFields && (
                      <>
                        <article>
                          <InputText icono={<V.iconodocumento />}>
                            <select
                              className="form__field"
                              {...register(`${name}.${index}.doc_type`)}
                            >
                              {EMERGENCY_DOC_TYPE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <label className="form__label">
                              Tipo de documento
                            </label>
                          </InputText>
                        </article>

                        <article>
                          <InputText icono={<V.iconodocumento />}>
                            <input
                              className="form__field"
                              type="text"
                              inputMode="numeric"
                              placeholder={docNumberLabel}
                              {...register(`${name}.${index}.doc_number`, {
                                validate: (value) => {
                                  const raw = safeString(value);
                                  if (!raw) return true;
                                  return /^\d+$/.test(raw) || "Solo numeros";
                                },
                              })}
                            />
                            <label className="form__label">{docNumberLabel}</label>
                            {getRowFieldError(errors, name, index, "doc_number") && (
                              <p>
                                {getRowFieldError(
                                  errors,
                                  name,
                                  index,
                                  "doc_number"
                                )}
                              </p>
                            )}
                          </InputText>
                        </article>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        ))}
      </div>

      <div className="inlineActions">
        <Btn1
          tipo="button"
          titulo="Agregar otro contacto"
          bgcolor="var(--bg-surface-muted)"
          icono={<V.iconoagregar />}
          funcion={() => append(createEmptyEmergencyContact(variant))}
        />
      </div>
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  gap: 12px;

  .helper {
    margin: 0;
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.9rem;
  }

  .contactList {
    display: grid;
    gap: 12px;
  }

  .contactCard {
    border: 1px dashed ${({ theme }) => theme.color2};
    border-radius: 12px;
    padding: 10px;
    display: grid;
    gap: 10px;
  }

  .contactHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .linkButton {
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    font-weight: 700;
    color: ${({ theme }) => theme.color1};
  }

  .linkButton.danger {
    color: var(--color-danger);
  }

  .fieldsGrid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px 18px;

    @media ${Device.mobile} {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    article {
      min-width: 0;
    }

    article.full {
      grid-column: 1 / -1;
    }
  }

  .inlineActions {
    display: flex;
    justify-content: flex-start;

    @media ${DeviceMax.mobile} {
      > button {
        width: 100%;
      }
    }
  }
`;
