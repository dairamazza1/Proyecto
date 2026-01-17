import { useEffect, useMemo } from "react";
import styled from "styled-components";
import { Btn1, InputText, Spinner1, usePermissions } from "../../../index";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  getEmpleadosReemplazoOptions,
  insertCambio,
  updateCambio,
} from "../../../supabase/crudCambios";
import { v } from "../../../styles/variables";
import { Device, DeviceMax } from "../../../styles/breakpoints";

const _V = v;

export function ModalCambiosForm({ empleadoId, cambio, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(cambio?.id);
  const { userRole } = usePermissions();
  const isEmployee = userRole === "employee";

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
      empleado_replace_id: "",
    },
  });

  const empleadoReplaceId = watch("empleado_replace_id");
  const durationType = watch("duration_type");
  const startDate = watch("start_date");
  const isTransitorio = durationType !== "permanente";

  const { data: reemplazoOptions = [], isLoading: loadingReemplazos } =
    useQuery({
      queryKey: ["empleadosReemplazoOptions", empleadoId],
      queryFn: () => getEmpleadosReemplazoOptions({ empleadoId }),
      enabled: Boolean(empleadoId),
      refetchOnWindowFocus: false,
      onError: (err) => {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: err?.message || "Error al cargar empleados de reemplazo.",
        });
      },
    });

  const optionsWithSelected = useMemo(() => {
    const base = [...reemplazoOptions];
    if (!isEdit || !cambio?.empleado_reemplazo) {
      return base;
    }
    const exists = base.some(
      (item) => String(item.id) === String(cambio.empleado_reemplazo.id ?? "")
    );
    if (exists) return base;
    const firstName = cambio.empleado_reemplazo.first_name ?? "";
    const lastName = cambio.empleado_reemplazo.last_name ?? "";
    return [
      {
        id: cambio.empleado_reemplazo.id,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        is_inactive: cambio.empleado_reemplazo.is_active === false,
      },
      ...base,
    ];
  }, [reemplazoOptions, isEdit, cambio]);

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
      empleado_replace_id: cambio.empleado_replace_id
        ? String(cambio.empleado_replace_id)
        : "",
    });
  }, [cambio, reset]);

  useEffect(() => {
    if (isTransitorio) return;
    setValue("start_date", "");
    setValue("end_date", "");
  }, [isTransitorio, setValue]);

  useEffect(() => {
    if (!isEdit || !cambio?.empleado_replace_id) return;
    if (!optionsWithSelected.length) return;
    const exists = optionsWithSelected.some(
      (item) => String(item.id) === String(cambio.empleado_replace_id ?? "")
    );
    if (!exists) return;
    if (empleadoReplaceId) return;
    setValue("empleado_replace_id", String(cambio.empleado_replace_id));
  }, [isEdit, cambio, optionsWithSelected, empleadoReplaceId, setValue]);

  useEffect(() => {
    if (loadingReemplazos || !empleadoReplaceId) return;
    const exists = optionsWithSelected.some(
      (item) => String(item.id) === String(empleadoReplaceId)
    );
    if (!exists) {
      setValue("empleado_replace_id", "");
    }
  }, [loadingReemplazos, empleadoReplaceId, optionsWithSelected, setValue]);

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
        empleado_replace_id: data.empleado_replace_id ?? null,
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
            {!isEmployee && (
              <>
                <article>
                  <InputText icono={<v.icononombre />}>
                    <input
                      className="form__field"
                      type="text"
                      placeholder="Horario o turno anterior"
                      {...register("previous_schedule")}
                    />
                    <label className="form__label">
                      Horario o turno anterior
                    </label>
                    {errors.previous_schedule?.message && (
                      <p>{errors.previous_schedule.message}</p>
                    )}
                  </InputText>
                </article>

                <article>
                  <InputText icono={<v.icononombre />}>
                    <input
                      className="form__field"
                      type="text"
                      placeholder="Horario o turno nuevo"
                      {...register("new_schedule")}
                    />
                    <label className="form__label">Horario o turno nuevo</label>
                    {errors.new_schedule?.message && (
                      <p>{errors.new_schedule.message}</p>
                    )}
                  </InputText>
                </article>

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
              </>
            )}

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

            

            <article>
              <InputText icono={<v.iconocodigobarras />}>
                <select
                  className="form__field"
                  {...register("empleado_replace_id", {
                    setValueAs: (value) => (value ? Number(value) : null),
                  })}
                  disabled={loadingReemplazos || !optionsWithSelected.length}
                >
                  <option value="">
                    {loadingReemplazos
                      ? "Cargando empleados..."
                      : optionsWithSelected.length
                      ? "Seleccionar empleado reemplazo"
                      : "Sin empleados disponibles"}
                  </option>
                  {optionsWithSelected.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.full_name || `Empleado ${option.id}`}
                      {option.is_inactive ? " (inactivo)" : ""}
                    </option>
                  ))}
                </select>
                <label className="form__label">Empleado reemplazo (opcional)</label>
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
