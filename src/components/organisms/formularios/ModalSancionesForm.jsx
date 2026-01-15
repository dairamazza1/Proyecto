import { useEffect } from "react";
import styled from "styled-components";
import { Btn1, InputText, Spinner1 } from "../../../index";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { insertSancion, updateSancion } from "../../../supabase/crudSanciones";
import { v } from "../../../styles/variables";
import { Device, DeviceMax } from "../../../styles/breakpoints";

const _V = v;

export function ModalSancionesForm({ empleadoId, sancion, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(sancion?.id);

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
  } = useForm({
    defaultValues: {
      sanction_type: "",
      description: "",
      policy_reference: "",
      sanction_date_start: "",
      sanction_date_end: "",
      document_id: "",
    },
  });

  const startDate = watch("sanction_date_start");

  useEffect(() => {
    if (!sancion) return;
    reset({
      sanction_type: sancion.sanction_type ?? "",
      description: sancion.description ?? "",
      policy_reference: sancion.policy_reference ?? "",
      sanction_date_start: sancion.sanction_date_start ?? "",
      sanction_date_end: sancion.sanction_date_end ?? "",
      document_id: sancion.document_id ?? "",
    });
  }, [sancion, reset]);

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
      const documentId = Number.isFinite(data.document_id)
        ? data.document_id
        : null;
      const payload = {
        empleado_id: empleadoId,
        sanction_type: data.sanction_type,
        description: data.description,
        policy_reference: data.policy_reference,
        sanction_date_start: data.sanction_date_start,
        sanction_date_end: data.sanction_date_end || null,
        document_id: documentId,
      };

      if (isEdit) {
        return updateSancion(sancion.id, payload);
      }
      return insertSancion(payload);
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al guardar sancion.",
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: isEdit ? "Sancion actualizada" : "Sancion registrada",
        text: isEdit ? "Se actualizo la sancion." : "Se registro la sancion.",
      });
      queryClient.invalidateQueries({ queryKey: ["sanciones", empleadoId] });
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
            <h1>{isEdit ? "Editar sancion" : "Registrar sancion"}</h1>
          </section>
          <section>
            <span onClick={onClose}>x</span>
          </section>
        </div>
        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          <section className="form-subcontainer">
            <article>
              <InputText icono={<v.iconoImportante />}>
                <select className="form__field" {...register("sanction_type")}>
                  <option value="Apercibimiento verbal">
                    Apercibimiento verbal
                  </option>
                  <option value="Apercibimiento escrito">
                    Apercibimiento escrito
                  </option>
                  <option value="Suspension">Suspension</option>
                  <option value="Otro">Otro</option>
                </select>

                <label className="form__label">Tipo de sanción</label>
                {errors.sanction_type?.message && (
                  <p>{errors.sanction_type.message}</p>
                )}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoCalendario />}>
                <input
                  className="form__field"
                  type="date"
                  {...register("sanction_date_start", {
                    required: "Campo requerido",
                  })}
                />
                <label className="form__label">Fecha inicio</label>
                {errors.sanction_date_start?.message && (
                  <p>{errors.sanction_date_start.message}</p>
                )}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoCalendario />}>
                <input
                  className="form__field"
                  type="date"
                  {...register("sanction_date_end", {
                    validate: (value) => {
                      if (!startDate || !value) return true;
                      return value >= startDate
                        ? true
                        : "La fecha de fin debe ser mayor o igual.";
                    },
                  })}
                />
                <label className="form__label">Fecha fin</label>
                {errors.sanction_date_end?.message && (
                  <p>{errors.sanction_date_end.message}</p>
                )}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.icononombre />}>
                <input
                  className="form__field"
                  type="text"
                  placeholder="Descripcion de los hechos"
                  {...register("description", {
                    required: "Campo requerido",
                  })}
                />
                <label className="form__label">Descripción de los hechos</label>
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoImportante />}>
                <input
                  className="form__field"
                  type="text"
                  placeholder="Politica o norma incumplida"
                  {...register("policy_reference", {
                    required: "Campo requerido",
                  })}
                />
                <label className="form__label">
                  Politica o norma incumplida
                </label>
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
