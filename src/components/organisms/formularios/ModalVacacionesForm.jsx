import { useEffect } from "react";
import styled from "styled-components";
import { Btn1, InputText, Spinner1 } from "../../../index";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  insertVacacion,
  updateVacacion,
} from "../../../supabase/crudVacaciones";
import { calcDaysTakenInclusive } from "../../../utils/vacaciones";
import { v } from "../../../styles/variables";
import { Device, DeviceMax } from "../../../styles/breakpoints";

const _V = v;

export function ModalVacacionesForm({ empleadoId, vacacion, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(vacacion?.id);

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      start_date: "",
      end_date: "",
      days_taken: 0,
    },
  });

  const startDate = watch("start_date");
  const endDate = watch("end_date");

  useEffect(() => {
    if (!vacacion) return;
    reset({
      start_date: vacacion.start_date ?? "",
      end_date: vacacion.end_date ?? "",
      days_taken: vacacion.days_taken ?? 0,
    });
  }, [vacacion, reset]);

  useEffect(() => {
    const days = calcDaysTakenInclusive(startDate, endDate);
    setValue("days_taken", days);
  }, [startDate, endDate, setValue]);

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
      const payload = {
        empleado_id: empleadoId,
        start_date: data.start_date,
        end_date: data.end_date,
        days_taken: data.days_taken,
        created_at: new Date().toISOString(),
      };

      if (isEdit) {
        return updateVacacion(vacacion.id, payload);
      }
      payload.status = "pending";
      return insertVacacion(payload);
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al guardar vacaciones.",
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: isEdit ? "Vacaciones actualizadas" : "Vacaciones registradas",
        text: isEdit
          ? "Se actualizaron las vacaciones."
          : "Se registraron las vacaciones.",
      });
      queryClient.invalidateQueries({ queryKey: ["vacaciones", empleadoId] });
      queryClient.invalidateQueries({ queryKey: ["empleado", empleadoId] });
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
            <h1>{isEdit ? "Editar vacaciones" : "Registrar vacaciones"}</h1>
          </section>
          <section>
            <span onClick={onClose}>x</span>
          </section>
        </div>
        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          <section className="form-subcontainer">
            <article>
              <InputText>
                <input
                  className="form__field"
                  type="date"
                  {...register("start_date", { required: "Campo requerido" })}
                />
                <label className="form__label">Fecha inicio</label>
                {errors.start_date?.message && (
                  <p>{errors.start_date.message}</p>
                )}
              </InputText>
            </article>

            <article>
              <InputText>
                <input
                  className="form__field"
                  type="date"
                  {...register("end_date", {
                    required: "Campo requerido",
                    validate: (value) => {
                      if (!startDate || !value) return true;
                      return value >= startDate
                        ? true
                        : "La fecha de fin debe ser mayor o igual a la fecha de inicio seleccionada.";
                    },
                  })}
                />
                <label className="form__label">Fecha fin</label>
                {errors.end_date?.message && <p>{errors.end_date.message}</p>}
              </InputText>
            </article>
            {startDate && endDate && (
              <article>
                <InputText icono={<v.iconoCalendario />}>
                  <input
                    className="form__field"
                    type="number"
                    value={watch("days_taken")}
                    {...register("days_taken")}
                    readOnly
                  />
                  <label className="form__label">Dias</label>
                </InputText>
              </article>
            )}

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
  width: min(620px, 100%);
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
    }
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
