import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Btn1, InputText, Spinner1 } from "../../../index";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "../../../hooks/usePermissions";
import Swal from "sweetalert2";
import {
  getFaltasCategorias,
  getFaltasTiposByCategoria,
  getFaltaTipoById,
  insertEmpleadoFalta,
  updateEmpleadoFalta,
  uploadFaltaCertificado,
} from "../../../supabase/crudFaltas";
import { insertEmpleadoDocumento } from "../../../supabase/crudLicencias";
import { calcDaysTakenInclusive } from "../../../utils/vacaciones";
import {
  ALLOWED_DOCUMENT_TYPES,
  validateDocumentFile,
} from "../../../utils/documentUploads";
import { v } from "../../../styles/variables";
import { Device, DeviceMax } from "../../../styles/breakpoints";

export function ModalFaltasForm({ empleadoId, falta, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(falta?.id);
  const { profile } = usePermissions();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const prevCategoriaRef = useRef();
  const fileInputRef = useRef(null);

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      falta_categoria_id: "",
      falta_tipo_id: "",
      start_date: "",
      end_date: "",
      days: 0,
      observations: "",
    },
  });

  const startDate = watch("start_date");
  const endDate = watch("end_date");
  const categoriaId = watch("falta_categoria_id");
  const tipoId = watch("falta_tipo_id");

  const existingFilePath = falta?.documento?.file_path || "";
  const hasExistingCertificate = Boolean(existingFilePath);

  const {
    data: categorias = [],
    isLoading: isLoadingCategorias,
    error: errorCategorias,
  } = useQuery({
    queryKey: ["faltasCategorias"],
    queryFn: getFaltasCategorias,
    refetchOnWindowFocus: false,
  });

  const {
    data: tipos = [],
    isLoading: isLoadingTipos,
    error: errorTipos,
  } = useQuery({
    queryKey: ["faltasTipos", categoriaId],
    queryFn: () => getFaltasTiposByCategoria(categoriaId),
    enabled: Boolean(categoriaId),
    refetchOnWindowFocus: false,
  });

  const { data: tipoById } = useQuery({
    queryKey: ["faltaTipo", falta?.falta_tipo_id],
    queryFn: () => getFaltaTipoById(falta?.falta_tipo_id),
    enabled: Boolean(isEdit && falta?.falta_tipo_id && !categoriaId),
    refetchOnWindowFocus: false,
  });

  const selectedTipo = useMemo(() => {
    const normalizedTipoId = String(tipoId ?? "");
    const fromList =
      tipos.find((tipo) => String(tipo.id) === normalizedTipoId) || null;
    return fromList || tipoById || null;
  }, [tipos, tipoId, tipoById]);

  const requiresCertificate = Boolean(selectedTipo?.requires_certificate);

  useEffect(() => {
    if (!falta) return;
    reset({
      falta_categoria_id: "",
      falta_tipo_id: "",
      start_date: falta.start_date ?? "",
      end_date: falta.end_date ?? "",
      days: falta.days ?? 0,
      observations: falta.observations ?? "",
    });
    setSelectedFile(null);
    setFileError("");
  }, [falta, reset]);

  useEffect(() => {
    if (!isEdit || categoriaId) return;
    const categoriaFromFalta =
      falta?.falta_tipo?.categoria_falta_id ?? null;
    const resolvedCategoria =
      categoriaFromFalta ?? tipoById?.categoria_falta_id ?? null;
    if (!resolvedCategoria) return;
    const existsInCategorias = categorias.some(
      (categoria) => String(categoria.id) === String(resolvedCategoria)
    );
    if (!existsInCategorias) return;
    setValue("falta_categoria_id", String(resolvedCategoria));
  }, [isEdit, categoriaId, falta, tipoById, categorias, setValue]);

  useEffect(() => {
    const days = calcDaysTakenInclusive(startDate, endDate);
    setValue("days", days);
  }, [startDate, endDate, setValue]);

  useEffect(() => {
    if (prevCategoriaRef.current && prevCategoriaRef.current !== categoriaId) {
      setValue("falta_tipo_id", "");
    }
    prevCategoriaRef.current = categoriaId;
  }, [categoriaId, setValue]);

  useEffect(() => {
    if (!isEdit) return;
    const existingTipoId = falta?.falta_tipo_id;
    if (!existingTipoId || tipoId) return;
    const existsInOptions = tipos.some(
      (tipo) => String(tipo.id) === String(existingTipoId)
    );
    if (existsInOptions) {
      setValue("falta_tipo_id", String(existingTipoId));
    }
  }, [isEdit, falta, tipoId, tipos, setValue]);

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
      if (requiresCertificate && !selectedFile && !hasExistingCertificate) {
        throw new Error("Debes adjuntar un certificado.");
      }

      let documentId = falta?.document_id ?? falta?.documento?.id ?? null;
      const existingTipoId = falta?.falta_tipo_id;
      const resolvedTipoId = data.falta_tipo_id || existingTipoId;

      if (!resolvedTipoId) {
        throw new Error("Selecciona un tipo de falta.");
      }

      if (selectedFile) {
        const filePath = await uploadFaltaCertificado({
          empleadoId,
          file: selectedFile,
        });
        const documento = await insertEmpleadoDocumento({
          empleado_id: empleadoId,
          document_type: "FALTA_CERTIFICADO",
          file_path: filePath,
          document_date: data.start_date,
          end_date: data.end_date || null,
          created_by: null,
        });
        documentId = documento?.id ?? null;
      }

      const payload = {
        empleado_id: empleadoId,
        falta_tipo_id: Number(resolvedTipoId),
        start_date: data.start_date,
        end_date: data.end_date,
        days: data.days,
        observations: data.observations || null,
      };

      if (documentId) {
        payload.document_id = documentId;
      }

      if (isEdit) {
        return updateEmpleadoFalta(falta.id, payload);
      }
      payload.status = "pending";
      if (profile?.id) {
        payload.created_by = profile.id;
      }
      return insertEmpleadoFalta(payload);
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al guardar falta.",
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: isEdit ? "Falta actualizada" : "Falta registrada",
        text: isEdit ? "Se actualizo la falta." : "Se registro la falta.",
      });
      queryClient.invalidateQueries({ queryKey: ["faltas", empleadoId] });
      onClose();
    },
  });

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      setFileError("");
      return;
    }
    const error = validateDocumentFile(file);
    if (error) {
      setSelectedFile(null);
      setFileError(error);
      return;
    }
    setSelectedFile(file);
    setFileError("");
  };

  const onSubmit = (data) => {
    mutate(data);
  };

  if (isPending) {
    return <Spinner1></Spinner1>;
  }

  if (errorCategorias || errorTipos) {
    return <span>ha ocurrido un error al cargar faltas.</span>;
  }

  return (
    <Overlay onClick={handleBackdropClick}>
      <Modal>
        <div className="headers">
          <section>
            <h1>{isEdit ? "Editar falta" : "Registrar falta"}</h1>
          </section>
          <section>
            <span onClick={onClose}>x</span>
          </section>
        </div>
        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          <section className="form-subcontainer">
            <article>
              <InputText icono={<v.iconocategorias />}>
                <select
                  className="form__field"
                  {...register("falta_categoria_id", {
                    required: "Campo requerido",
                  })}
                >
                  <option value="">
                    {isLoadingCategorias
                      ? "Cargando..."
                      : "Seleccionar categoria"}
                  </option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.name}
                    </option>
                  ))}
                </select>
                <label className="form__label">Categoría de falta</label>
                {errors.falta_categoria_id?.message && (
                  <p>{errors.falta_categoria_id.message}</p>
                )}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconodocumento />}>
                <select
                  className="form__field"
                  {...register("falta_tipo_id", {
                    required: "Campo requerido",
                  })}
                  disabled={!categoriaId || isLoadingTipos}
                >
                  <option value="">
                    {!categoriaId
                      ? "Seleccionar categoria"
                      : isLoadingTipos
                      ? "Cargando..."
                      : "Seleccionar tipo"}
                  </option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.name}
                    </option>
                  ))}
                </select>
                <label className="form__label">Tipo de falta</label>
                {errors.falta_tipo_id?.message && (
                  <p>{errors.falta_tipo_id.message}</p>
                )}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoCalendario />}>
                <input
                  className="form__field"
                  type="date"
                  {...register("start_date", { required: "Campo requerido" })}
                />
                <label className="form__label">Fecha de inicio</label>
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
                    required: "Campo requerido",
                    validate: (value) => {
                      if (!startDate || !value) return true;
                      return value >= startDate
                        ? true
                        : "La fecha de fin debe ser mayor o igual.";
                    },
                  })}
                />
                <label className="form__label">Fecha de fin</label>
                {errors.end_date?.message && <p>{errors.end_date.message}</p>}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoCalendario />}>
                <input
                  className="form__field"
                  type="number"
                  value={watch("days")}
                  {...register("days")}
                  readOnly
                />
                <label className="form__label">Días</label>
              </InputText>
            </article>

            <article className="full">
              <InputText icono={<v.iconoImportante />}>
                <textarea
                  className="form__field textarea"
                  rows={3}
                  placeholder="Observaciones"
                  {...register("observations")}
                />
                <label className="form__label">Observaciones</label>
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconopdf />}>
                <input
                  className="form__field"
                  type="file"
                  accept={ALLOWED_DOCUMENT_TYPES.join(",")}
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <label className="form__label">Adjuntar certificado</label>
              </InputText>
              {hasExistingCertificate && !selectedFile && (
                <p className="helper">certificado cargado</p>
              )}
              {fileError && <p>{fileError}</p>}
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

      .full {
        grid-column: 1 / -1;
      }
    }
  }

  .textarea {
    resize: vertical;
    min-height: 110px;
    padding-top: 12px;
  }

  .helper {
    color: ${({ theme }) => theme.textsecundary};
    margin-top: 6px;
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
