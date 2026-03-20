import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { Btn1, InputText, Spinner1 } from "../../../index";
import { egresarPacienteIngreso } from "../../../supabase/crudPacientes";
import { Device, DeviceMax } from "../../../styles/breakpoints";
import { v } from "../../../styles/variables";

const ChevronIcon = v.iconoFlechabajo;
const CloseIcon = v.iconocerrar;
const CalendarIcon = v.iconoCalendario;
const ImportantIcon = v.iconoImportante;
const SaveIcon = v.iconoguardar;

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value);

const getCurrentDateTimeInput = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const toDateTimeLocalInput = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(
    parsed.getDate()
  )}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
};

const toIsoDateTime = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return null;
  return parsed.toISOString();
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()} ${pad(
    parsed.getHours()
  )}:${pad(parsed.getMinutes())}`;
};

const createDefaultValues = () => ({
  discharge_at: getCurrentDateTimeInput(),
  discharge_summary: "",
});

function FormSection({ title, subtitle, isOpen, onToggle, children }) {
  return (
    <section className="sectionCard">
      <button type="button" className="sectionToggle" onClick={onToggle}>
        <div className="headerTexts">
          <span className="title">{title}</span>
          {subtitle ? <small>{subtitle}</small> : null}
        </div>
        <span className={`chevron ${isOpen ? "expanded" : ""}`}>
          <ChevronIcon />
        </span>
      </button>
      {isOpen ? <div className="sectionBody">{children}</div> : null}
    </section>
  );
}

export function ModalPacienteEgresoForm({
  pacienteId,
  ingreso,
  patientName = "",
  onClose,
}) {
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState({
    dischargeData: true,
    teamSummary: true,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: createDefaultValues(),
  });

  const currentDateTimeInput = getCurrentDateTimeInput();
  const admissionAtInput = useMemo(
    () => toDateTimeLocalInput(ingreso?.admission_at),
    [ingreso?.admission_at]
  );
  const patientLabel = useMemo(() => {
    const normalized = safeString(patientName).trim();
    return normalized || "Paciente";
  }, [patientName]);

  useEffect(() => {
    reset({
      discharge_at: getCurrentDateTimeInput(),
      discharge_summary: "",
    });
  }, [ingreso?.id, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (!ingreso?.id) {
        throw new Error("No hay ingreso activo para egresar.");
      }

      const dischargeAtIso = toIsoDateTime(data.discharge_at);
      if (!dischargeAtIso) {
        throw new Error("Debe indicar fecha y hora de egreso valida.");
      }

      return egresarPacienteIngreso(ingreso.id, {
        status: "discharged",
        discharge_at: dischargeAtIso,
        discharge_summary: safeString(data.discharge_summary).trim() || null,
      });
    },
    onSuccess: () => {
      const pacienteQueryId = String(pacienteId ?? "");
      Swal.fire({
        icon: "success",
        title: "Paciente egresado",
        text: "El episodio activo fue cerrado.",
      });
      [["pacienteIngresos", pacienteQueryId], ["pacienteDetalle", pacienteQueryId]].forEach(
        (queryKey) => {
          queryClient.invalidateQueries({ queryKey });
          queryClient.refetchQueries({
            queryKey,
            type: "active",
            exact: true,
          });
        }
      );
      queryClient.invalidateQueries({ queryKey: ["pacientesActivos"] });
      onClose?.();
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error?.message || "No se pudo registrar el egreso.",
      });
    },
  });

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !mutation.isPending) onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mutation.isPending, onClose]);

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Overlay
      onClick={(event) =>
        event.target === event.currentTarget && !mutation.isPending && onClose?.()
      }
    >
      <Modal onClick={(event) => event.stopPropagation()}>
        {mutation.isPending ? (
          <div className="processingOverlay">
            <Spinner1 />
            <p>Registrando egreso...</p>
          </div>
        ) : null}

        <div className="headers">
          <div>
            <h1>Registrar egreso</h1>
            <p>{patientLabel}</p>
          </div>
          <span
            role="button"
            tabIndex={mutation.isPending ? -1 : 0}
            onClick={() => !mutation.isPending && onClose?.()}
            onKeyDown={(event) => {
              if ((event.key === "Enter" || event.key === " ") && !mutation.isPending) {
                event.preventDefault();
                onClose?.();
              }
            }}
          >
            <CloseIcon />
          </span>
        </div>

        <div className="patientContext">
          <span className="contextLabel">Ingreso vigente</span>
          <strong>{formatDateTime(ingreso?.admission_at)}</strong>
        </div>

        <form className="formulario" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
          <FormSection
            title="Datos del egreso"
            subtitle="Complete la fecha y hora efectiva del cierre"
            isOpen={expandedSections.dischargeData}
            onToggle={() => toggleSection("dischargeData")}
          >
            <div className="fieldsGrid">
              <article>
                <InputText icono={<CalendarIcon />}>
                  <input
                    className="form__field"
                    type="datetime-local"
                    max={currentDateTimeInput}
                    {...register("discharge_at", {
                      required: "Campo requerido",
                      validate: (value) => {
                        const normalized = safeString(value).trim();
                        if (!normalized) return true;
                        if (normalized > currentDateTimeInput) {
                          return "La fecha y hora de egreso no puede ser mayor al momento actual";
                        }
                        if (admissionAtInput && normalized < admissionAtInput) {
                          return "La fecha y hora de egreso no puede ser anterior al ingreso";
                        }
                        return true;
                      },
                    })}
                  />
                  <label className="form__label">Fecha de egreso</label>
                  {errors.discharge_at?.message ? (
                    <p>{errors.discharge_at.message}</p>
                  ) : null}
                </InputText>
              </article>
            </div>
          </FormSection>

          <FormSection
            title="Observaciones del equipo tratante"
            subtitle="Este bloque queda preparado para ampliar el resumen de egreso"
            isOpen={expandedSections.teamSummary}
            onToggle={() => toggleSection("teamSummary")}
          >
            <div className="fieldsGrid">
              <article className="full">
                <InputText icono={<ImportantIcon />}>
                  <textarea
                    className="form__field textarea"
                    rows={5}
                    placeholder="Observaciones del equipo tratante"
                    {...register("discharge_summary")}
                  />
                  <label className="form__label">
                    Observaciones del equipo tratante
                  </label>
                </InputText>
              </article>
            </div>
          </FormSection>

          <div className="acciones">
            <Btn1
              tipo="button"
              icono={<CloseIcon />}
              titulo="Cancelar"
              bgcolor="var(--bg-surface-muted)"
              disabled={mutation.isPending}
              funcion={onClose}
            />
            <Btn1
              icono={<SaveIcon />}
              titulo={mutation.isPending ? "Guardando..." : "Confirmar egreso"}
              bgcolor="var(--color-danger-action)"
              disabled={mutation.isPending}
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
  z-index: 2000;
  background-color: var(--overlay-backdrop);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 16px;
  overflow-y: auto;
`;

const Modal = styled.div`
  position: relative;
  width: min(760px, 100%);
  max-height: calc(100dvh - 48px);
  background: ${({ theme }) => theme.bgtotal};
  border-radius: 18px;
  box-shadow: var(--shadow-elev-1);
  padding: 18px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: auto 0;

  @media ${Device.mobile} {
    padding: 22px;
    border-radius: 20px;
  }

  .headers {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
  }

  .headers h1 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .headers p {
    margin: 4px 0 0;
    color: ${({ theme }) => theme.textsecundary};
  }

  .headers span {
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    user-select: none;
    color: ${({ theme }) => theme.text};
  }

  .processingOverlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: var(--overlay-backdrop);
    display: grid;
    place-items: center;
    gap: 10px;
    padding: 24px;
    text-align: center;
  }

  .processingOverlay p {
    margin: 0;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }

  .patientContext {
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bg};
    border-radius: 14px;
    padding: 12px;
    display: grid;
    gap: 4px;
    margin-bottom: 14px;
  }

  .contextLabel {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.textsecundary};
  }

  .formulario {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding-right: 8px;
    padding-bottom: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scrollbar-gutter: stable;
  }

  .sectionCard {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    background: ${({ theme }) => theme.bg};
    overflow: visible;
  }

  .sectionToggle {
    width: 100%;
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.text};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 14px;
    text-align: left;
    cursor: pointer;
  }

  .sectionToggle:hover {
    background: ${({ theme }) => theme.color2};
  }

  .headerTexts {
    display: grid;
    gap: 2px;
  }

  .headerTexts .title {
    font-weight: 700;
    font-size: 16px;
  }

  .headerTexts small {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.textsecundary};
  }

  .chevron {
    color: ${({ theme }) => theme.color1};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 160ms ease;
  }

  .chevron.expanded {
    transform: rotate(180deg);
  }

  .sectionBody {
    border-top: 1px solid ${({ theme }) => theme.color2};
    padding: 12px 14px 14px;
  }

  .fieldsGrid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px 18px;

    @media ${Device.tablet} {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  article.full {
    grid-column: 1 / -1;
  }

  article {
    min-width: 0;
  }

  .textarea {
    resize: vertical;
    min-height: 132px;
    padding-top: 12px;
  }

  .acciones {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 4px;
    margin-top: 4px;

    @media ${DeviceMax.mobile} {
      flex-direction: column-reverse;
      align-items: stretch;
    }
  }
`;
