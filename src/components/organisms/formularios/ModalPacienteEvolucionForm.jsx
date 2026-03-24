import { useEffect, useMemo } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { Btn1, InputText, Spinner1 } from "../../../index";
import {
  insertPacienteEvolucion,
  updatePacienteEvolucion,
} from "../../../supabase/crudPacientes";
import {
  argentinaDateTimeInputToIso,
  getArgentinaCurrentDateTimeInput,
  getArgentinaDateTimeInputForDate,
  isoToArgentinaDateTimeInput,
} from "../../../utils/argentinaDateTime";
import { Device, DeviceMax } from "../../../styles/breakpoints";
import { v } from "../../../styles/variables";

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value);

export function ModalPacienteEvolucionForm({
  pacienteId,
  ingresoId,
  selectedDate,
  evolucionPreselected = null,
  onClose,
  queryKey,
}) {
  const queryClient = useQueryClient();
  const currentDateTimeInput = getArgentinaCurrentDateTimeInput();
  const isEditMode = Boolean(evolucionPreselected?.id);
  const formValues = useMemo(
    () => ({
      evolution_at:
        isoToArgentinaDateTimeInput(evolucionPreselected?.evolution_at) ||
        getArgentinaDateTimeInputForDate(selectedDate),
      notes: safeString(evolucionPreselected?.notes),
    }),
    [
      evolucionPreselected?.evolution_at,
      evolucionPreselected?.notes,
      selectedDate,
    ],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: formValues,
  });

  useEffect(() => {
    reset(formValues);
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
        throw new Error("No se encontro el paciente para registrar la evolucion.");
      }
      if (!ingresoId) {
        throw new Error("Seleccione un ingreso activo para registrar la evolucion.");
      }

      const evolutionAtIso = argentinaDateTimeInputToIso(data.evolution_at);
      if (!evolutionAtIso) {
        throw new Error("Debe indicar una fecha y hora validas.");
      }

      const payload = {
        evolution_at: evolutionAtIso,
        notes: safeString(data.notes).trim() || null,
      };

      if (isEditMode) {
        return updatePacienteEvolucion(evolucionPreselected.id, payload);
      }

      return insertPacienteEvolucion({
        paciente_id: pacienteId,
        ingreso_id: ingresoId,
        ...payload,
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: isEditMode ? "Evolucion actualizada" : "Evolucion registrada",
        text: isEditMode
          ? "La evolucion diaria fue actualizada correctamente."
          : "La evolucion diaria fue guardada correctamente.",
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
            ? "No se pudo actualizar la evolucion."
            : "No se pudo guardar la evolucion."),
      });
    },
  });

  const onSubmit = (data) => {
    mutate(data);
  };

  if (isPending) {
    return <Spinner1 />;
  }

  return (
    <Overlay onClick={(event) => event.target === event.currentTarget && onClose?.()}>
      <Modal onClick={(event) => event.stopPropagation()}>
        <div className="headers">
          <section>
            <h1>{isEditMode ? "Editar evolucion" : "Agregar evolucion"}</h1>
          </section>
          <section>
            <span onClick={() => onClose?.()}>x</span>
          </section>
        </div>

        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          <section className="form-subcontainer">
            <article>
              <InputText icono={<v.iconoCalendario />}>
                <input
                  className="form__field"
                  type="datetime-local"
                  max={currentDateTimeInput}
                  {...register("evolution_at", {
                    required: "Campo requerido",
                    validate: (value) => {
                      const normalized = safeString(value).trim();
                      if (!normalized) return true;
                      if (normalized > currentDateTimeInput) {
                        return "La fecha y hora no puede ser mayor al momento actual.";
                      }
                      if (selectedDate && normalized.slice(0, 10) !== selectedDate) {
                        return "La evolucion debe registrarse dentro del dia seleccionado.";
                      }
                      return true;
                    },
                  })}
                />
                <label className="form__label">Fecha y hora</label>
                {errors.evolution_at?.message ? (
                  <p>{errors.evolution_at.message}</p>
                ) : null}
              </InputText>
            </article>

            <article className="full">
              <InputText icono={<v.iconoImportante />}>
                <textarea
                  className="form__field textarea"
                  placeholder="Detalle de la evolucion"
                  rows={5}
                  {...register("notes", {
                    required: "La evolucion es obligatoria.",
                  })}
                />
                <label className="form__label">Evolucion</label>
                {errors.notes?.message ? <p>{errors.notes.message}</p> : null}
              </InputText>
            </article>

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
          </section>
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
  width: min(100%, 720px);
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
      margin: 0;
      font-size: 1.2rem;
    }

    span {
      cursor: pointer;
      font-size: 1.4rem;
      line-height: 1;
    }
  }

  .formulario,
  .form-subcontainer {
    display: grid;
    gap: 16px;
  }

  .form-subcontainer {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  article.full {
    grid-column: 1 / -1;
  }

  .textarea {
    min-height: 140px;
    resize: vertical;
  }

  .acciones {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  @media ${DeviceMax.mobile} {
    width: 100%;
    padding: 18px 16px;

    .form-subcontainer {
      grid-template-columns: 1fr;
    }
  }
`;
