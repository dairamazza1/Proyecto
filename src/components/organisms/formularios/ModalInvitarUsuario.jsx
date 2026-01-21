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

const _V = v;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ModalInvitarUsuario({
  empresaId,
  onClose,
  empleadoId = null,
  empleadoLabel = "",
}) {
  const queryClient = useQueryClient();
  const lockedEmpleadoId = empleadoId ? Number(empleadoId) : null;
  const showSwal = (options) => {
    const onOpen = options?.didOpen;
    return Swal.fire({
      ...options,
      didOpen: (popup) => {
        const container = Swal.getContainer();
        if (container) {
          container.style.zIndex = "3000";
        }
        if (typeof onOpen === "function") {
          onOpen(popup);
        }
      },
    });
  };

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
    enabled: Boolean(empresaId) && !lockedEmpleadoId,
    refetchOnWindowFocus: false,
    onError: (err) => {
      showSwal({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al cargar empleados disponibles.",
      });
    },
  });

  useEffect(() => {
    if (!lockedEmpleadoId) return;
    reset((prev) => ({
      ...prev,
      empleado_id: lockedEmpleadoId,
    }));
  }, [lockedEmpleadoId, reset]);

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
        empleado_id: lockedEmpleadoId ?? (formData.empleado_id || null),
      });
    },
    onError: (err) => {
      console.log(err);
      
      showSwal({
        icon: "error",
        title: "No se pudo invitar",
        text: err?.message || "Error al enviar invitacion.",
      });
    },
    onSuccess: (result) => {
      const status = String(result?.status ?? "");
      const emailSent =
        typeof result?.email_sent === "boolean"
          ? result.email_sent
          : status !== "linked";
      const isLinked =
        status === "linked" || (status === "accepted" && emailSent === false);

      if (isLinked || emailSent === false) {
        showSwal({
          icon: "info",
          title: "Usuario ya registrado",
          text:
            "El email ya tiene una cuenta confirmada. No se envia invitacion. Si necesita acceso, restablece la contrasena.",
        });
      } else {
        const wasResent = Boolean(result?.resent);
        showSwal({
          icon: "success",
          title: wasResent ? "Invitacion reenviada" : "Invitacion enviada",
          text: "El usuario recibira un email de invitacion.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["invitaciones"] });
      queryClient.invalidateQueries({ queryKey: ["empleadosDisponibles"] });
      if (lockedEmpleadoId) {
        queryClient.invalidateQueries({ queryKey: ["empleado", String(lockedEmpleadoId)] });
        queryClient.invalidateQueries({ queryKey: ["empleado", lockedEmpleadoId] });
      }
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
                </select>
                <label className="form__label">Rol</label>
              </InputText>
            </article>

            <article>
              <InputText icono={<v.icononombre />}>
                {lockedEmpleadoId ? (
                  <>
                    <input
                      className="form__field"
                      type="text"
                      value={empleadoLabel || `Empleado ${lockedEmpleadoId}`}
                      disabled
                      readOnly
                    />
                    <label className="form__label">Empleado</label>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
                bgcolor="var(--bg-surface-muted)"
                funcion={onClose}
                tipo="button"
              />
              <Btn1
                icono={<v.iconoagregar />}
                titulo="Invitar"
                bgcolor={v.colorPrincipal}
                disabled={!empresaId}
              />
            </div>
          </section>
        </form>
      </Modal>
      {isPending && (
        <LoadingOverlay>
          <Spinner1 />
        </LoadingOverlay>
      )}
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
  box-shadow: var(--shadow-elev-2);
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
    color: ${({ theme }) => theme.colorError};
    font-size: 0.9rem;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: var(--overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
`;
