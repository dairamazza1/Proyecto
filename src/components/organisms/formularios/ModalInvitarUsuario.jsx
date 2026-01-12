import { useEffect } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  Btn1,
  InputText,
  Spinner1,
  getAvailableEmpleados,
  inviteUser,
} from "../../../index";
import { v } from "../../../styles/variables";
import { Device, DeviceMax } from "../../../styles/breakpoints";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ModalInvitarUsuario({ empresaId, onClose }) {
  const queryClient = useQueryClient();

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      email: "",
      app_role: "employee",
      empleado_id: "",
    },
  });

  const { data: empleados = [], isLoading: loadingEmpleados } = useQuery({
    queryKey: ["empleadosDisponibles", empresaId],
    queryFn: () => getAvailableEmpleados({ empresa_id: empresaId }),
    enabled: Boolean(empresaId),
    refetchOnWindowFocus: false,
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al cargar empleados disponibles.",
      });
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
    mutationFn: async (formData) => {
      if (!empresaId) {
        throw new Error("Empresa no disponible");
      }
      return inviteUser({
        empresa_id: empresaId,
        email: formData.email.trim(),
        app_role: formData.app_role,
        empleado_id: formData.empleado_id || null,
      });
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo invitar",
        text: err?.message || "Error al enviar invitacion.",
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Invitacion enviada",
        text: "El usuario recibira un email de invitacion.",
      });
      queryClient.invalidateQueries({ queryKey: ["invitaciones"] });
      queryClient.invalidateQueries({ queryKey: ["empleadosDisponibles"] });
      reset();
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
            <h1>Invitar usuario</h1>
          </section>
          <section>
            <span onClick={onClose}>x</span>
          </section>
        </div>
        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          <section className="form-subcontainer">
            <article>
              <InputText icono={<v.iconoemail />}>
                <input
                  className="form__field"
                  type="email"
                  placeholder="Email"
                  {...register("email", {
                    required: "Email requerido",
                    pattern: {
                      value: emailPattern,
                      message: "Email invalido",
                    },
                  })}
                />
                <label className="form__label">Email</label>
                {errors.email?.message && <p>{errors.email.message}</p>}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoUser />}>
                <select
                  className="form__field"
                  {...register("app_role", { required: true })}
                >
                  <option value="employee">Empleado</option>
                  <option value="rrhh">RRHH</option>
                  <option value="admin">Admin</option>
                </select>
                <label className="form__label">Rol</label>
              </InputText>
            </article>

            <article>
              <InputText icono={<v.icononombre />}>
                <select
                  className="form__field"
                  {...register("empleado_id", {
                    setValueAs: (value) =>
                      value ? Number(value) : null,
                  })}
                  disabled={loadingEmpleados}
                >
                  <option value="">
                    {loadingEmpleados
                      ? "Cargando empleados..."
                      : empleados.length
                        ? "Seleccionar empleado (opcional)"
                        : "Sin empleados disponibles"}
                  </option>
                  {empleados.map((empleado) => {
                    const firstName = empleado.first_name ?? "";
                    const lastName = empleado.last_name ?? "";
                    const fullName = `${firstName} ${lastName}`.trim();
                    const legajo = empleado.employee_id_number
                      ? ` - ${empleado.employee_id_number}`
                      : "";
                    return (
                      <option key={empleado.id} value={empleado.id}>
                        {fullName || `Empleado ${empleado.id}`}
                        {legajo}
                      </option>
                    );
                  })}
                </select>
                <label className="form__label">Empleado</label>
              </InputText>
            </article>

            {!empresaId && (
              <span className="warning">
                No se encontro la empresa activa.
              </span>
            )}

            <div className="acciones">
              <Btn1
                icono={<v.iconocerrar />}
                titulo="Cancelar"
                bgcolor="rgb(183, 183, 182)"
                funcion={onClose}
                tipo="button"
              />
              <Btn1
                icono={<v.iconoagregar />}
                titulo="Invitar"
                bgcolor="#F9D70B"
                disabled={!empresaId}
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
  box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.25);
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
    }
  }

  .acciones {
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

  .warning {
    grid-column: 1 / -1;
    color: ${({ theme }) => theme.colorError || "#F54E41"};
    font-size: 0.9rem;
  }
`;
