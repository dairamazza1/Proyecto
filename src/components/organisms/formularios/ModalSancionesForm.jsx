import { useEffect } from "react";
import styled from "styled-components";
import { Btn1, InputText, Spinner1 } from "../../../index";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { insertSancion, updateSancion } from "../../../supabase/crudSanciones";
import { v } from "../../../styles/variables";

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
                <input
                  className="form__field"
                  type="text"
                  placeholder="tipo"
                  {...register("sanction_type", {
                    required: "Campo requerido",
                  })}
                />
                <label className="form__label">tipo sancion</label>
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
                <label className="form__label">fecha inicio</label>
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
                <label className="form__label">fecha fin</label>
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
                  placeholder="descripcion"
                  {...register("description")}
                />
                <label className="form__label">descripcion</label>
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoImportante />}>
                <input
                  className="form__field"
                  type="text"
                  placeholder="politica"
                  {...register("policy_reference")}
                />
                <label className="form__label">politica</label>
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoNumbers />}>
                <input
                  className="form__field"
                  type="number"
                  placeholder="documento"
                  {...register("document_id", { valueAsNumber: true })}
                />
                <label className="form__label">documento</label>
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
