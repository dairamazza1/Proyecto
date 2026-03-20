import { useEffect } from "react";
import styled from "styled-components";
import {
  Btn1,
  InputText,
  Spinner1,
  ROLE_IDS,
  usePermissions,
} from "../../../index";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  insertCambio,
  updateCambio,
} from "../../../supabase/crudCambios";
import { v } from "../../../styles/variables";
import { Device, DeviceMax } from "../../../styles/breakpoints";

const _V = v;

export function ModalCambiosForm({ empleadoId, cambio, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(cambio?.id);
  const { userRoleId } = usePermissions();
  const isEmployee = userRoleId === ROLE_IDS.EMPLOYEE;

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      previous_schedule: "",
      new_schedule: "",
      previous_tasks: "",
      new_tasks: "",
      change_reason: "",
      duration_type: "transitorio",
      start_date: "",
      end_date: "",
    },
  });

  const durationType = watch("duration_type");
  const startDate = watch("start_date");
  const isTransitorio = durationType !== "permanente";

  useEffect(() => {
    if (!cambio) return;
    reset({
      previous_schedule: cambio.previous_schedule ?? "",
      new_schedule: cambio.new_schedule ?? "",
      previous_tasks: cambio.previous_tasks ?? "",
      new_tasks: cambio.new_tasks ?? "",
      change_reason: cambio.change_reason ?? "",
      duration_type: cambio.duration_type ?? "transitorio",
      start_date: cambio.start_date ?? "",
      end_date: cambio.end_date ?? "",
    });
  }, [cambio, reset]);

  useEffect(() => {
    if (isTransitorio) return;
    setValue("start_date", "");
    setValue("end_date", "");
  }, [isTransitorio, setValue]);

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
      const isTransitorioPayload = data.duration_type === "transitorio";
      const payload = {
        empleado_id: empleadoId,
        previous_schedule: data.previous_schedule,
        new_schedule: data.new_schedule,
        previous_tasks: data.previous_tasks,
        new_tasks: data.new_tasks,
        change_reason: data.change_reason,
        duration_type: data.duration_type ?? "transitorio",
        start_date: isTransitorioPayload ? data.start_date : null,
        end_date: isTransitorioPayload ? data.end_date || null : null,
      };

      if (isEdit) {
        return updateCambio(cambio.id, payload);
      }
      payload.status = "pending";
      return insertCambio(payload);
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al guardar cambio.",
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: isEdit ? "Cambio actualizado" : "Cambio registrado",
        text: isEdit ? "Se actualizo el cambio." : "Se registro el cambio.",
      });
      queryClient.invalidateQueries({ queryKey: ["cambios", empleadoId] });
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
            <h1>{isEdit ? "Editar cambio" : "Registrar cambio"}</h1>
          </section>
          <section>
            <span onClick={onClose}>x</span>
          </section>
        </div>
        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          <section className="form-subcontainer">
            
              <article>
                <InputText icono={<v.icononombre />}>
                  {/* <input
                    className="form__field"
                    type="text"
                    placeholder="Turno anterior"
                    {...register("previous_schedule")}
                  /> */}
                  <select
                    className="form__field"
                    {...register("previous_schedule", {
                      validate: (value) => {
                        if (!value) return "Campo requerido";
                      },
                    })}
                  >
                    <option value="manana">Mañana</option>
                    <option value="tarde">Tarde</option>
                    <option value="noche">Noche</option>
                    <option value="rotativo">Rotativo</option>
                  </select>
                  <label className="form__label">Turno anterior</label>
                  {errors.previous_schedule?.message && (
                    <p>{errors.previous_schedule.message}</p>
                  )}
                </InputText>
              </article>

              <article>
                <InputText icono={<v.icononombre />}>
                  {/* <input
                      className="form__field"
                      type="text"
                      placeholder="Turno nuevo"
                      {...register("new_schedule")}
                    /> */}
                  <select
                    className="form__field"
                    {...register("new_schedule", {
                      validate: (value) => {
                        if (!value) return "Campo requerido";
                      },
                    })}
                  >
                    <option value="manana">Mañana</option>
                    <option value="tarde">Tarde</option>
                    <option value="noche">Noche</option>
                    <option value="rotativo">Rotativo</option>
                  </select>
                  <label className="form__label">Turno nuevo</label>
                  {errors.new_schedule?.message && (
                    <p>{errors.new_schedule.message}</p>
                  )}
                </InputText>
              </article>

              {!isEmployee && (
                <>
                <article>
                  <InputText icono={<v.icononombre />}>
                    <input
                      className="form__field"
                      type="text"
                      placeholder="Tareas anteriores"
                    {...register("previous_tasks")}
                  />
                  <label className="form__label">Tareas anteriores</label>
                </InputText>
              </article>

              <article>
                <InputText icono={<v.icononombre />}>
                  <input
                    className="form__field"
                    type="text"
                    placeholder="Tareas nuevas"
                    {...register("new_tasks")}
                  />
                  <label className="form__label">Tareas nuevas</label>
                </InputText>
              </article>
              </>)}
            

            <article>
              <InputText icono={<v.icononombre />}>
                {/* <input
                  className="form__field"
                  type="text"
                  placeholder="Motivo del cambio"
                  {...register("change_reason")}
                /> */}
                <select
                  className="form__field"
                  {...register("change_reason", {
                    validate: (value) => {
                      if (!value) return "Campo requerido";
                    },
                  })}
                >
                  <option value="Necesidades del servicio">
                    Necesidades del servicio
                  </option>
                  <option value="Reorganizacion interna">
                    Reorganización interna
                  </option>
                  <option value="Solicitud del empleado">
                    Solicitud del empleado
                  </option>
                  <option value="Cambio transitorio">Cambio transitorio</option>
                  <option value="Cambio permanente">Cambio permanente</option>
                  <option value="Otro">Otro</option>
                </select>

                <label className="form__label">Motivo del cambio</label>
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoCalendario />}>
                <select
                  className="form__field"
                  {...register("duration_type", { required: true })}
                >
                  <option value="transitorio">Transitorio</option>
                  <option value="permanente">Permanente</option>
                </select>
                <label className="form__label">Tipo de duracion</label>
              </InputText>
            </article>

            {isTransitorio && (
              <>
                <article>
                  <InputText icono={<v.iconoCalendario />}>
                    <input
                      className="form__field"
                      type="date"
                      {...register("start_date", {
                        validate: (value) =>
                          isTransitorio
                            ? value
                              ? true
                              : "Campo requerido"
                            : true,
                      })}
                    />
                    <label className="form__label">Fecha inicio</label>
                    {errors.start_date?.message && (
                      <p>{errors.start_date.message}</p>
                    )}
                  </InputText>
                </article>

                <article>
                  <InputText icono={<v.iconoCalendario />}>
                    <input
                      className="form__field"
                      type="date"
                      {...register("end_date", {
                        validate: (value) => {
                          if (!isTransitorio) return true;
                          if (!value) return "Campo requerido";
                          if (!startDate) return true;
                          return value >= startDate
                            ? true
                            : "La fecha de fin debe ser mayor o igual.";
                        },
                      })}
                    />
                    <label className="form__label">Fecha fin</label>
                    {errors.end_date?.message && (
                      <p>{errors.end_date.message}</p>
                    )}
                  </InputText>
                </article>
              </>
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
  width: min(720px, 100%);
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
