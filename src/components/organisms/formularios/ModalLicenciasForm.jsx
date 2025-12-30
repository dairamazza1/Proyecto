import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Btn1, InputText, Spinner1 } from "../../../index";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  getLicenciasCategorias,
  getLicenciasTiposByCategoria,
  getLicenciaTipoById,
  insertEmpleadoDocumento,
  insertEmpleadoLicencia,
  updateEmpleadoLicencia,
  uploadLicenciaCertificado,
} from "../../../supabase/crudLicencias";
import { calcDaysTakenInclusive } from "../../../utils/vacaciones";
import { v } from "../../../styles/variables";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function validateFile(file) {
  if (!file) return "Selecciona un archivo.";
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Formato invalido. Usa PDF o imagen.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "El archivo supera 5 MB.";
  }
  return "";
}

export function ModalLicenciasForm({ empleadoId, licencia, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(licencia?.id);
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
      licencia_categoria_id: "",
      licencia_tipo_id: "",
      start_date: "",
      end_date: "",
      days: 0,
      status: "pending",
    },
  });

  const startDate = watch("start_date");
  const endDate = watch("end_date");
  const categoriaId = watch("licencia_categoria_id");
  const tipoId = watch("licencia_tipo_id");

  const existingFilePath =
    licencia?.documento?.file_path || licencia?.certificate_url || "";
  const hasExistingCertificate = Boolean(existingFilePath);

  const {
    data: categorias = [],
    isLoading: isLoadingCategorias,
    error: errorCategorias,
  } = useQuery({
    queryKey: ["licenciasCategorias"],
    queryFn: getLicenciasCategorias,
    refetchOnWindowFocus: false,
  });

  const {
    data: tipos = [],
    isLoading: isLoadingTipos,
    error: errorTipos,
  } = useQuery({
    queryKey: ["licenciasTipos", categoriaId],
    queryFn: () => getLicenciasTiposByCategoria(categoriaId),
    enabled: Boolean(categoriaId),
    refetchOnWindowFocus: false,
  });

  const { data: tipoById } = useQuery({
    queryKey: ["licenciaTipo", licencia?.licencia_tipo_id],
    queryFn: () => getLicenciaTipoById(licencia?.licencia_tipo_id),
    enabled: Boolean(isEdit && licencia?.licencia_tipo_id && !categoriaId),
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
    if (!licencia) return;
    reset({
      licencia_categoria_id: "",
      licencia_tipo_id: "",
      start_date: licencia.start_date ?? "",
      end_date: licencia.end_date ?? "",
      days: licencia.days ?? 0,
      status: licencia.status ?? "pending",
    });
    setSelectedFile(null);
    setFileError("");
  }, [licencia, reset]);

  useEffect(() => {
    if (!isEdit || categoriaId) return;
    const categoriaFromLicencia =
      licencia?.licencia_tipo?.categoria_licencia_id ?? null;
    const resolvedCategoria =
      categoriaFromLicencia ?? tipoById?.categoria_licencia_id ?? null;
    if (!resolvedCategoria) return;
    const existsInCategorias = categorias.some(
      (categoria) => String(categoria.id) === String(resolvedCategoria)
    );
    if (!existsInCategorias) return;
    setValue("licencia_categoria_id", String(resolvedCategoria));
  }, [isEdit, categoriaId, licencia, tipoById, categorias, setValue]);

  useEffect(() => {
    const days = calcDaysTakenInclusive(startDate, endDate);
    setValue("days", days);
  }, [startDate, endDate, setValue]);

  useEffect(() => {
    if (prevCategoriaRef.current && prevCategoriaRef.current !== categoriaId) {
      setValue("licencia_tipo_id", "");
    }
    prevCategoriaRef.current = categoriaId;
  }, [categoriaId, setValue]);

  useEffect(() => {
    if (!isEdit) return;
    const existingTipoId = licencia?.licencia_tipo_id;
    if (!existingTipoId || tipoId) return;
    const existsInOptions = tipos.some(
      (tipo) => String(tipo.id) === String(existingTipoId)
    );
    if (existsInOptions) {
      setValue("licencia_tipo_id", String(existingTipoId));
    }
  }, [isEdit, licencia, tipoId, tipos, setValue]);

  useEffect(() => {
    if (!requiresCertificate) {
      setSelectedFile(null);
      setFileError("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [requiresCertificate]);

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

      let documentId = licencia?.document_id ?? licencia?.documento?.id ?? null;
      const existingTipoId = licencia?.licencia_tipo_id;
      const resolvedTipoId = data.licencia_tipo_id || existingTipoId;

      if (!resolvedTipoId) {
        throw new Error("Selecciona un tipo de licencia.");
      }

      if (selectedFile) {
        const filePath = await uploadLicenciaCertificado({
          empleadoId,
          file: selectedFile,
        });
        const documento = await insertEmpleadoDocumento({
          empleado_id: empleadoId,
          document_type: "LICENCIA_CERTIFICADO",
          file_path: filePath,
          document_date: data.start_date,
          end_date: data.end_date || null,
          created_by: null,
        });
        documentId = documento?.id ?? null;
      }

      const payload = {
        empleado_id: empleadoId,
        licencia_tipo_id: Number(resolvedTipoId),
        start_date: data.start_date,
        end_date: data.end_date,
        days: data.days,
        status: isEdit ? data.status : "pending",
      };

      if (documentId) {
        payload.document_id = documentId;
      }

      if (isEdit) {
        return updateEmpleadoLicencia(licencia.id, payload);
      }
      return insertEmpleadoLicencia(payload);
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al guardar licencia.",
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: isEdit ? "Licencia actualizada" : "Licencia registrada",
        text: isEdit ? "Se actualizo la licencia." : "Se registro la licencia.",
      });
      queryClient.invalidateQueries({ queryKey: ["licencias", empleadoId] });
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
    const error = validateFile(file);
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
    return <span>ha ocurrido un error al cargar licencias.</span>;
  }

  return (
    <Overlay onClick={handleBackdropClick}>
      <Modal>
        <div className="headers">
          <section>
            <h1>{isEdit ? "Editar licencia" : "Registrar licencia"}</h1>
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
                  {...register("licencia_categoria_id", {
                    required: "Campo requerido",
                  })}
                >
                  <option value="">
                    {isLoadingCategorias ? "Cargando..." : "Seleccionar categoria"}
                  </option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.name}
                    </option>
                  ))}
                </select>
                <label className="form__label">categoria licencia</label>
                {errors.licencia_categoria_id?.message && (
                  <p>{errors.licencia_categoria_id.message}</p>
                )}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconodocumento />}>
                <select
                  className="form__field"
                  {...register("licencia_tipo_id", {
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
                <label className="form__label">tipo licencia</label>
                {errors.licencia_tipo_id?.message && (
                  <p>{errors.licencia_tipo_id.message}</p>
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
                <label className="form__label">fecha inicio</label>
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
                <label className="form__label">fecha fin</label>
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
                <label className="form__label">dias</label>
              </InputText>
            </article>

            {requiresCertificate && (
              <article>
                <InputText icono={<v.iconopdf />}>
                  <input
                    className="form__field"
                    type="file"
                    accept={ALLOWED_TYPES.join(",")}
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                  <label className="form__label">certificado</label>
                </InputText>
                {hasExistingCertificate && !selectedFile && (
                  <p className="helper">certificado cargado</p>
                )}
                {fileError && <p>{fileError}</p>}
              </article>
            )}

            {isEdit && (
              <article>
                <InputText icono={<v.iconoCalendario />}>
                  <select className="form__field" {...register("status")}>
                    <option value="pending">Pendiente</option>
                    <option value="approved">Aprobado</option>
                    <option value="rejected">Rechazado</option>
                  </select>
                  <label className="form__label">Estado</label>
                </InputText>
              </article>
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

  .helper {
    color: ${({ theme }) => theme.textsecundary};
    margin-top: 6px;
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
