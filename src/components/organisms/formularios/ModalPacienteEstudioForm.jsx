import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { Btn1, InputText, Spinner1, usePermissions } from "../../../index";
import {
  deletePacienteEstudio,
  insertPacienteEstudio,
  insertPacienteEstudioArchivo,
  removePacienteEstudioArchivo,
  updatePacienteEstudio,
  uploadPacienteEstudioArchivo,
} from "../../../supabase/crudPacientes";
import {
  ALLOWED_DOCUMENT_TYPES,
  validateDocumentFile,
} from "../../../utils/documentUploads";
import { DeviceMax } from "../../../styles/breakpoints";
import { v } from "../../../styles/variables";

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value);

export function ModalPacienteEstudioForm({
  pacienteId,
  ingresoId,
  estudioPreselected = null,
  onClose,
  queryKey,
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const { profile } = usePermissions();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const isEditMode = Boolean(estudioPreselected?.id);
  const existingAttachments = estudioPreselected?.archivos ?? [];
  const formValues = useMemo(
    () => ({
      study_type: safeString(estudioPreselected?.study_type),
      study_name: safeString(estudioPreselected?.study_name),
      indication: safeString(estudioPreselected?.indication),
    }),
    [
      estudioPreselected?.indication,
      estudioPreselected?.study_name,
      estudioPreselected?.study_type,
    ],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: formValues,
  });

  useEffect(() => {
    reset(formValues);
    setSelectedFile(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [formValues, reset]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      if (!pacienteId) {
        throw new Error("No se encontro el paciente para registrar el estudio.");
      }
      if (!ingresoId) {
        throw new Error("Seleccione un ingreso activo para registrar estudios.");
      }

      const payload = {
        paciente_id: pacienteId,
        ingreso_id: ingresoId,
        study_type: safeString(data.study_type).trim(),
        study_name: safeString(data.study_name).trim(),
        indication: safeString(data.indication).trim() || null,
      };

      if (!payload.study_type) {
        throw new Error("Debe completar el tipo de estudio.");
      }

      if (!payload.study_name) {
        throw new Error("Debe completar el nombre del estudio.");
      }

      let studyRecord = null;
      let uploadedFilePath = null;

      try {
        if (isEditMode) {
          studyRecord = await updatePacienteEstudio(estudioPreselected.id, {
            study_type: payload.study_type,
            study_name: payload.study_name,
            indication: payload.indication,
          });
        } else {
          if (!profile?.id) {
            throw new Error("No se pudo resolver el usuario autenticado.");
          }

          studyRecord = await insertPacienteEstudio({
            ...payload,
            status: "requested",
            created_by: profile.id,
          });
        }

        if (selectedFile) {
          uploadedFilePath = await uploadPacienteEstudioArchivo({
            pacienteId,
            estudioId: studyRecord?.id,
            file: selectedFile,
          });

          await insertPacienteEstudioArchivo({
            estudio_id: studyRecord?.id,
            file_path: uploadedFilePath,
            file_name: selectedFile.name,
            mime_type: selectedFile.type || null,
            created_by: profile?.id ?? null,
          });
        }

        return studyRecord;
      } catch (error) {
        if (uploadedFilePath) {
          await removePacienteEstudioArchivo(uploadedFilePath).catch(() => null);
        }

        if (!isEditMode && studyRecord?.id) {
          await deletePacienteEstudio(studyRecord.id).catch(() => null);
        }

        throw error;
      }
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: isEditMode ? "Estudio actualizado" : "Estudio registrado",
        text: isEditMode
          ? "El estudio fue actualizado correctamente."
          : "El estudio fue guardado correctamente.",
      });

      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
        queryClient.refetchQueries({
          queryKey,
          type: "active",
          exact: true,
        });
      }

      onClose?.();
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text:
          error?.message ||
          (isEditMode
            ? "No se pudo actualizar el estudio."
            : "No se pudo guardar el estudio."),
      });
    },
  });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      setFileError("");
      return;
    }

    const validationError = validateDocumentFile(file);
    if (validationError) {
      setSelectedFile(null);
      setFileError(validationError);
      return;
    }

    setSelectedFile(file);
    setFileError("");
  };

  if (isPending) {
    return <Spinner1 />;
  }

  return (
    <Overlay
      onClick={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <Modal onClick={(event) => event.stopPropagation()}>
        <div className="headers">
          <section>
            <h1>{isEditMode ? "Editar estudio" : "Agregar estudio"}</h1>
            <small>Registro de estudios medicos de la internacion seleccionada.</small>
          </section>
          <section>
            <span onClick={() => onClose?.()}>x</span>
          </section>
        </div>

        <form className="formulario" onSubmit={handleSubmit((data) => mutate(data))}>
          <section className="form-subcontainer">
            <article>
              <InputText icono={<v.iconodocumento />}>
                <input
                  className="form__field"
                  type="text"
                  placeholder="Ej. Laboratorio"
                  {...register("study_type", {
                    required: "Campo requerido",
                    validate: (value) =>
                      safeString(value).trim() ? true : "Campo requerido",
                  })}
                />
                <label className="form__label">Tipo de estudio</label>
                {errors.study_type?.message ? <p>{errors.study_type.message}</p> : null}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconodocumento />}>
                <input
                  className="form__field"
                  type="text"
                  placeholder="Ej. Hemograma completo"
                  {...register("study_name", {
                    required: "Campo requerido",
                    validate: (value) =>
                      safeString(value).trim() ? true : "Campo requerido",
                  })}
                />
                <label className="form__label">Nombre del estudio</label>
                {errors.study_name?.message ? <p>{errors.study_name.message}</p> : null}
              </InputText>
            </article>

            <article className="statusPreview">
              <span className="previewLabel">Archivo adjunto</span>
              <strong>
                {selectedFile?.name ||
                  (existingAttachments.length
                    ? `${existingAttachments.length} archivo(s) cargado(s)`
                    : "Sin archivo")}
              </strong>
            </article>

            <article className="full">
              <InputText icono={<v.iconoImportante />}>
                <textarea
                  className="form__field textarea"
                  rows={4}
                  placeholder="Observacion o indicacion del estudio"
                  {...register("indication")}
                />
                <label className="form__label">Observacion / indicacion</label>
              </InputText>
            </article>

            <article className="full">
              <InputText icono={<v.iconopdf />}>
                <input
                  ref={fileInputRef}
                  className="form__field"
                  type="file"
                  //multiple={true}
                  accept={ALLOWED_DOCUMENT_TYPES.join(",")}
                  onChange={handleFileChange}
                />
                <label className="form__label">Adjuntar archivo</label>
              </InputText>
              <small className="helper">
                Formatos permitidos: PDF, JPG, PNG y WEBP. Maximo 5 MB.
              </small>
              {fileError ? <p className="fileError">{fileError}</p> : null}
            </article>

            <div className="acciones">
              <Btn1
                icono={<v.iconocerrar />}
                titulo="Cancelar"
                bgcolor="var(--bg-surface-muted)"
                funcion={() => onClose?.()}
                tipo="button"
              />
              <Btn1
                icono={<v.iconoguardar />}
                titulo={isEditMode ? "Guardar cambios" : "Guardar"}
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
  position: fixed;
  inset: 0;
  background: var(--overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;

  @media ${DeviceMax.mobile} {
    padding: 16px;
    align-items: flex-start;
    overflow-y: auto;
  }
`;

const Modal = styled.div`
  width: min(100%, 760px);
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  box-shadow: var(--shadow-elev-2);
  padding: 22px 22px 18px;
  display: grid;
  gap: 18px;

  .headers {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;

    h1 {
      margin: 0;
      font-size: 1.2rem;
    }

    small {
      display: block;
      margin-top: 4px;
      color: ${({ theme }) => theme.textsecundary};
    }

    span {
      cursor: pointer;
      font-size: 1.4rem;
      line-height: 1;
    }
  }

  .formulario,
  .form-subcontainer {
    display: grid;
    gap: 16px;
  }

  .form-subcontainer {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  article.full {
    grid-column: 1 / -1;
  }

  .statusPreview {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    padding: 12px 14px;
    background: ${({ theme }) => theme.bgtotal};
    display: grid;
    gap: 4px;
  }

  .previewLabel {
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .textarea {
    min-height: 130px;
    resize: vertical;
  }

  .helper {
    display: block;
    margin-top: 8px;
    color: ${({ theme }) => theme.textsecundary};
  }

  .fileError {
    margin: 8px 0 0;
    color: var(--color-danger);
  }

  .acciones {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  @media ${DeviceMax.mobile} {
    width: 100%;
    padding: 18px 16px;

    .form-subcontainer {
      grid-template-columns: 1fr;
    }
  }
`;
