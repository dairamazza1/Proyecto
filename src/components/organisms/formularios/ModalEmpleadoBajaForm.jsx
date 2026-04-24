import { useEffect } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { Btn1, InputText, Spinner1 } from "../../../index";
import { updateEmpleado } from "../../../supabase/crudEmpleados";
import { getArgentinaTodayDateInput } from "../../../utils/argentinaDateTime";
import { Device, DeviceMax } from "../../../styles/breakpoints";
import { v } from "../../../styles/variables";

const IconoCalendario = v.iconoCalendario;
const IconoCerrar = v.iconocerrar;
const IconoImportante = v.iconoImportante;

export function ModalEmpleadoBajaForm({ empleadoId, empleadoLabel = "", onClose }) {
  const queryClient = useQueryClient();
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    defaultValues: {
      termination_date: getArgentinaTodayDateInput(),
    },
  });

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
    mutationFn: ({ termination_date }) =>
      updateEmpleado(empleadoId, {
        is_active: false,
        termination_date,
      }),
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo dar de baja",
        text: err?.message || "Intenta nuevamente.",
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["empleado", String(empleadoId)] }),
        queryClient.invalidateQueries({ queryKey: ["empleado", empleadoId] }),
        queryClient.invalidateQueries({ queryKey: ["empleados"] }),
        queryClient.invalidateQueries({ queryKey: ["pacienteEquipo"] }),
        queryClient.invalidateQueries({ queryKey: ["sucursalEmpleado", String(empleadoId)] }),
        queryClient.invalidateQueries({ queryKey: ["sucursalEmpleado", empleadoId] }),
      ]);

      Swal.fire({
        icon: "success",
        title: "Empleado dado de baja",
        text: "Se registro la fecha de finalizacion laboral.",
      });
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
    return <Spinner1 />;
  }

  return (
    <Overlay onClick={handleBackdropClick}>
      <Modal>
        <div className="headers">
          <section>
            <h1>Dar de baja empleado</h1>
            {empleadoLabel ? <p>{empleadoLabel}</p> : null}
          </section>
          <section>
            <span onClick={onClose}>x</span>
          </section>
        </div>

        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          <section className="form-subcontainer">
            <article className="full">
              <InputText icono={<IconoCalendario />}>
                <input
                  className="form__field"
                  type="date"
                  {...register("termination_date", {
                    required: "La fecha de finalizacion es obligatoria.",
                  })}
                />
                <label className="form__label">Fecha de finalizacion laboral</label>
                {errors.termination_date?.message && (
                  <p>{errors.termination_date.message}</p>
                )}
              </InputText>
            </article>

            <div className="acciones">
              <Btn1
                icono={<IconoCerrar />}
                titulo="Cancelar"
                bgcolor="var(--bg-surface-muted)"
                funcion={onClose}
                tipo="button"
              />
              <Btn1
                icono={<IconoImportante />}
                titulo="Dar de baja"
                bgcolor="var(--color-danger)"
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
  width: min(520px, 100%);
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
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 12px;

    h1,
    p {
      margin: 0;
    }

    h1 {
      font-size: 18px;
      font-weight: 500;
    }

    p {
      color: ${({ theme }) => theme.textsecundary};
      margin-top: 4px;
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

      .full {
        grid-column: 1 / -1;
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
