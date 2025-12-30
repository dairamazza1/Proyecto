import { useEffect } from "react";
import styled from "styled-components";
import { Btn1, InputText, Spinner1 } from "../../../index";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { insertCambio, updateCambio } from "../../../supabase/crudCambios";
import { v } from "../../../styles/variables";

export function ModalCambiosForm({ empleadoId, cambio, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(cambio?.id);

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      previous_schedule: "",
      new_schedule: "",
      previous_tasks: "",
      new_tasks: "",
      change_reason: "",
      effective_date: "",
      status: "pending",
      empleado_replace_id: "",
    },
  });

  useEffect(() => {
    if (!cambio) return;
    reset({
      previous_schedule: cambio.previous_schedule ?? "",
      new_schedule: cambio.new_schedule ?? "",
      previous_tasks: cambio.previous_tasks ?? "",
      new_tasks: cambio.new_tasks ?? "",
      change_reason: cambio.change_reason ?? "",
      effective_date: cambio.effective_date ?? "",
      status: cambio.status ?? "pending",
      empleado_replace_id: cambio.empleado_replace_id ?? "",
    });
  }, [cambio, reset]);

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
        previous_schedule: data.previous_schedule,
        new_schedule: data.new_schedule,
        previous_tasks: data.previous_tasks,
        new_tasks: data.new_tasks,
        change_reason: data.change_reason,
        effective_date: data.effective_date,
        status: data.status,
        empleado_replace_id: data.empleado_replace_id || null,
      };

      if (isEdit) {
        return updateCambio(cambio.id, payload);
      }
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
                <input
                  className="form__field"
                  type="text"
                  placeholder="horario anterior"
                  {...register("previous_schedule", {
                    required: "Campo requerido",
                  })}
                />
                <label className="form__label">horario anterior</label>
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
                  placeholder="horario nuevo"
                  {...register("new_schedule", { required: "Campo requerido" })}
                />
                <label className="form__label">horario nuevo</label>
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
                  placeholder="tareas anteriores"
                  {...register("previous_tasks")}
                />
                <label className="form__label">tareas anteriores</label>
              </InputText>
            </article>

            <article>
              <InputText icono={<v.icononombre />}>
                <input
                  className="form__field"
                  type="text"
                  placeholder="tareas nuevas"
                  {...register("new_tasks")}
                />
                <label className="form__label">tareas nuevas</label>
              </InputText>
            </article>

            <article>
              <InputText icono={<v.icononombre />}>
                <input
                  className="form__field"
                  type="text"
                  placeholder="motivo"
                  {...register("change_reason")}
                />
                <label className="form__label">motivo</label>
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoCalendario />}>
                <input
                  className="form__field"
                  type="date"
                  {...register("effective_date", {
                    required: "Campo requerido",
                  })}
                />
                <label className="form__label">fecha efectiva</label>
                {errors.effective_date?.message && (
                  <p>{errors.effective_date.message}</p>
                )}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoCalendario />}>
                <select className="form__field" {...register("status")}>
                  <option value="pending">pendiente</option>
                  <option value="approved">aprobado</option>
                  <option value="rejected">rechazado</option>
                </select>
                <label className="form__label">estado</label>
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconocodigobarras />}>
                <input
                  className="form__field"
                  type="number"
                  placeholder="empleado reemplazo"
                  {...register("empleado_replace_id")}
                />
                <label className="form__label">empleado reemplazo</label>
              </InputText>
            </article>

            <div className="acciones">
              <Btn1
                icono={<v.iconocerrar />}
                titulo="Cancelar"
                bgcolor="rgb(183, 183, 182)"
                funcion={onClose}
                tipo="button"
              />
              <Btn1
                icono={<v.iconoguardar />}
                titulo="Guardar"
                bgcolor="#F9D70B"
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
  background-color: rgba(10, 9, 9, 0.5);
  display: flex;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

const Modal = styled.div`
  position: relative;
  width: min(720px, 100%);
  max-width: 100%;
  border-radius: 18px;
  background: ${({ theme }) => theme.bgtotal};
  box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.25);
  padding: 16px 18px 20px 18px;

  @media (min-width: ${v.bplisa}) {
    padding: 18px 26px 24px 26px;
    border-radius: 20px;
  }

  .headers {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

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
    .form-subcontainer {
      gap: 16px;
      display: grid;
      grid-template-columns: 1fr;

      @media (min-width: ${v.bplisa}) {
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

    @media (max-width: ${v.bplisa}) {
      flex-direction: column-reverse;
      align-items: stretch;
      gap: 10px;
    }
  }
`;
