import { useEffect } from "react";
import styled from "styled-components";
import { Btn1, InputText, Spinner1 } from "../../../index";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  insertEnfermeriaRecord,
  updateEnfermeriaRecord,
} from "../../../supabase/crudEnfermeria";
import { v } from "../../../styles/variables";
import { Device, DeviceMax } from "../../../styles/breakpoints";

const getCurrentTimeValue = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const parseTimeToMinutes = (value) => {
  if (!value) return null;
  const [rawHours, rawMinutes] = String(value).split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const isTimeInShift = (value, shiftValue) => {
  const minutes = parseTimeToMinutes(value);
  if (minutes == null) return false;

  if (shiftValue === "manana") {
    return minutes >= 6 * 60 && minutes < 14 * 60;
  }
  if (shiftValue === "tarde") {
    return minutes >= 14 * 60 && minutes < 22 * 60;
  }
  if (shiftValue === "noche") {
    return minutes >= 22 * 60 || minutes < 6 * 60;
  }
  return true;
};

const getShiftRangeLabel = (shiftValue) => {
  if (shiftValue === "manana") return "06:00-14:00";
  if (shiftValue === "tarde") return "14:00-22:00";
  if (shiftValue === "noche") return "22:00-06:00";
  return "";
};

export function ModalEnfermeriaForm({
  record,
  shift,
  registroDate,
  sucursalId,
  empleadoId,
  responsableName,
  onClose,
  queryKey,
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(record?.id);

  const resolveMutationErrorMessage = (err) => {
    const message = String(err?.message ?? "");
    const code = String(err?.code ?? "");
    const lower = message.toLowerCase();
    const isPermissionError =
      code === "42501" ||
      lower.includes("row-level security") ||
      lower.includes("permission denied");

    if (isPermissionError) {
      return "No tenés permiso para registrar en este turno para esta fecha.";
    }

    return message || "Error al guardar el registro.";
  };

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      registro_time: getCurrentTimeValue(),
      details: "",
    },
  });

  useEffect(() => {
    if (!record) {
      reset({
        registro_time: getCurrentTimeValue(),
        details: "",
      });
      return;
    }
    reset({
      registro_time: record.registro_time
        ? String(record.registro_time).slice(0, 5)
        : getCurrentTimeValue(),
      details: record.details ?? "",
    });
  }, [record, reset]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      if (!isEdit) {
        if (!shift || !registroDate || !sucursalId) {
          throw new Error("Selecciona sucursal, fecha y turno.");
        }

        const payload = {
          empleado_id: empleadoId ? Number(empleadoId) : null, // admin puede ser null
          shift,
          registro_date: registroDate,
          registro_time: data.registro_time,
          details: data.details,
          sucursal_id: Number(sucursalId), // asegurá número
        };

        return insertEnfermeriaRecord(payload);
      }

      const payload = {
        registro_time: data.registro_time,
        details: data.details,
      };
      return updateEnfermeriaRecord(record.id, payload);
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: resolveMutationErrorMessage(err),
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: isEdit ? "Registro actualizado" : "Registro creado",
        text: isEdit ? "Se actualizo el registro." : "Se registro el detalle.",
      });
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }
      onClose();
    },
  });

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const onSubmit = (data) => {
    mutate(data);
  };

  if (isPending) {
    return <Spinner1></Spinner1>;
  }

  return (
    <Overlay onClick={handleBackdropClick}>
      <Modal>
        <div className="headers">
          <section>
            <h1>{isEdit ? "Editar registro" : "Agregar registro"}</h1>
          </section>
          <section>
            <span onClick={onClose}>x</span>
          </section>
        </div>
        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          <section className="form-subcontainer">
            <article>
              <InputText icono={<v.iconoCalendario />}>
                <input
                  className="form__field"
                  type="time"
                  {...register("registro_time", {
                    required: "Campo requerido",
                    validate: (value) => {
                      if (!shift) return true;
                      if (!isTimeInShift(value, shift)) {
                        const range = getShiftRangeLabel(shift);
                        return range
                          ? `Hora fuera del rango permitido (${range}).`
                          : "Hora fuera del rango permitido.";
                      }
                      return true;
                    },
                  })}
                />
                <label className="form__label">Hora</label>
                {errors.registro_time?.message && (
                  <p>{errors.registro_time.message}</p>
                )}
              </InputText>
            </article>

            <article className="full">
              <InputText icono={<v.iconoImportante />}>
                <textarea
                  className="form__field textarea"
                  placeholder="Detalle"
                  rows={4}
                  {...register("details", {
                    required: "El detalle es obligatorio.",
                  })}
                />
                <label className="form__label">Detalle</label>
                {errors.details?.message && <p>{errors.details.message}</p>}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoUser />}>
                <input
                  className="form__field"
                  type="text"
                  value={responsableName || "-"}
                  readOnly
                />
                <label className="form__label">Responsable</label>
              </InputText>
            </article>

            <div className="acciones">
              <Btn1
                icono={<v.iconocerrar />}
                titulo="Cancelar"
                bgcolor="var(--bg-surface-muted)"
                funcion={onClose}
                tipo="button"
              />
              <Btn1
                icono={<v.iconoguardar />}
                titulo="Guardar"
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
  transition: 0.5s;
  top: 0;
  left: 0;
  position: fixed;
  background-color: var(--overlay-backdrop);
  display: flex;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px 16px;
  overflow: hidden;
`;

const Modal = styled.div`
  position: relative;
  width: min(640px, 100%);
  max-width: 100%;
  border-radius: 18px;
  background: ${({ theme }) => theme.bgtotal};
  box-shadow: var(--shadow-elev-1);
  padding: 18px;
  box-sizing: border-box;
  max-height: calc(100dvh - 48px);
  display: flex;
  flex-direction: column;

  @media ${Device.mobile} {
    padding: 24px;
    border-radius: 20px;
  }

  .headers {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 12px;

    h1 {
      font-size: 18px;
      font-weight: 500;
    }

    span {
      font-size: 20px;
      cursor: pointer;
    }
  }

  .formulario {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    min-height: 0;
    box-sizing: border-box;
    overflow-y: auto;
    padding-right: 12px;
    scrollbar-gutter: stable;

    @media ${DeviceMax.mobile} {
      padding-right: 8px;
    }

    .form-subcontainer {
      gap: 16px;
      display: grid;
      grid-template-columns: 1fr;

      @media ${Device.mobile} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px 20px;
      }

      .full {
        grid-column: 1 / -1;
      }
    }
  }

  .textarea {
    resize: vertical;
    min-height: 120px;
    padding-top: 14px;
  }

  .acciones {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 4px;

    @media ${DeviceMax.mobile} {
      flex-direction: column-reverse;
      align-items: stretch;
      gap: 10px;
    }
  }
`;
