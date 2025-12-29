import { useEffect, useState } from "react";
import styled from "styled-components";
import { v } from "../../../styles/variables";
import {
  InputText,
  Btn1,
  Spinner1,
  useCompanyStore,
  useEmpleadosStore,
  useSucursalesStore,
  ConvertirCapitalize,
  insertSucursalEmpleado,
  getAreasLaborales,
  getPuestosByArea,
  getPuestoById,
  checkEmpleadoDuplicate,
  upsertSucursalEmpleado,
} from "../../../index";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export function RegistrarEmpleados({
  mode = "create",
  empleadoId,
  empleado,
  sucursalEmpleado,
  onClose,
}) {
  const navigate = useNavigate();
  const { dataCompany } = useCompanyStore();
  const { createEmpleado, updateEmpleado } = useEmpleadosStore();
  const { showSucursales, dataSucursales } = useSucursalesStore();
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = mode === "edit";
  const isModal = Boolean(onClose);
  const headerTitle = isEdit ? "Editar empleado" : "Registrar empleado";

  const getEmpleadoErrorText = (err, fallbackText) => {
    if (err?.code !== "23505") {
      console.log(err);
      
      return err?.message || fallbackText;
    }

    const raw = `${err?.message ?? ""} ${err?.details ?? ""}`.toLowerCase();

    if (
      raw.includes("document_number") ||
      raw.includes("empleados_document_number")
    ) {
      return "El numero de documento ya existe.";
    }
    if (
      raw.includes("employee_id_number") ||
      raw.includes("empleados_employee_id_number")
    ) {
      return "El numero de legajo ya existe.";
    }
    if (
      raw.includes("professional_number") ||
      raw.includes("empleados_professional_number")
    ) {
      return "La matricula ya existe.";
    }
    return "Ya existe un empleado con alguno de estos datos.";
  };

  const handleMutationError = (fallbackText) => (err) => {
    const text = getEmpleadoErrorText(err, fallbackText);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text,
    });
    setSaving(false);
  };

  const handleMutationSuccess = (title, text, after) => (data) => {
    setSaving(false);
    Swal.fire({
      icon: "success",
      title,
      text,
    });
    after?.(data);
  };

  useEffect(() => {
    if (!isModal) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModal, onClose]);

  // Cargar sucursales al montar el componente
  useQuery({
    queryKey: ["mostrar sucursales", dataCompany?.id],
    queryFn: () => showSucursales({ empresa_id: dataCompany?.id }),
    enabled: !!dataCompany,
    refetchOnWindowFocus: false,
  });

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      document_type: "DNI",
      is_registered: false,
      is_active: "true",
    },
  });

  const areaId = watch("area_id");
  const puestoId = watch("puesto_id");
  const isRegistered = watch("is_registered");
  const isActiveValue = watch("is_active");
  const showTerminationDate = isEdit && String(isActiveValue) === "false";
  

  const { data: dataAreas, isLoading: loadingAreas } = useQuery({
    queryKey: ["mostrar areas laborales"],
    queryFn: () => getAreasLaborales(),
    refetchOnWindowFocus: false,
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al cargar areas laborales.",
      });
    },
  });
  const { data: dataPuestos, isLoading: loadingPuestos } = useQuery({
    queryKey: ["mostrar puestos laborales", areaId],
    queryFn: () => getPuestosByArea(areaId),
    enabled: !!areaId,
    refetchOnWindowFocus: false,
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al cargar puestos laborales.",
      });
    },
  });

  useEffect(() => {
    setValue("puesto_id", "");
  }, [areaId, setValue]);

  const selectedPuesto = dataPuestos?.find(
    (puesto) => String(puesto.id) === String(puestoId)
  );
  const requiresProfessionalNumber = Boolean(
    selectedPuesto?.requires_professional_number
  );

  const { data: puestoInfo } = useQuery({
    queryKey: ["puestoInfo", empleado?.puesto_id],
    queryFn: () => getPuestoById(empleado?.puesto_id),
    enabled: isEdit && Boolean(empleado?.puesto_id),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isEdit || !empleado) return;
    reset({
      first_name: empleado.first_name ?? "",
      last_name: empleado.last_name ?? "",
      employee_id_number: empleado.employee_id_number ?? "",
      document_type: empleado.document_type ?? "DNI",
      document_number: empleado.document_number ?? "",
      area_id: "",
      puesto_id: "",
      is_registered: empleado.is_registered ?? false,
      professional_number: empleado.professional_number ?? "",
      sucursal_id: sucursalEmpleado?.sucursal_id
        ? String(sucursalEmpleado.sucursal_id)
        : "",
      hire_date: empleado.hire_date ?? "",
      is_active: empleado.is_active ? "true" : "false",
      termination_date: empleado.termination_date ?? "",
    });
  }, [empleado, isEdit, reset, sucursalEmpleado]);

  useEffect(() => {
    if (!isEdit || !puestoInfo?.id_area) return;
    setValue("area_id", String(puestoInfo.id_area));
  }, [isEdit, puestoInfo, setValue]);

  useEffect(() => {
    if (!isEdit || !empleado?.puesto_id || !dataPuestos?.length) return;
    setValue("puesto_id", String(empleado.puesto_id));
  }, [dataPuestos, empleado, isEdit, setValue]);

  const { mutate: doInsertar } = useMutation({
    mutationFn: insertar,
    mutationKey: "insertar empleados",
    onError: handleMutationError("Error al registrar empleado."),
    onSuccess: handleMutationSuccess(
      "Empleado registrado",
      "Se registro el empleado correctamente.",
      () => {
        queryClient.invalidateQueries({ queryKey: ["empleados"] });
        reset();
        if (onClose) {
          onClose();
        } else {
          navigate("/");
        }
      }
    ),
  });

  const { mutate: doActualizar } = useMutation({
    mutationFn: actualizar,
    mutationKey: "actualizar empleados",
    onError: handleMutationError("Error al actualizar empleado."),
    onSuccess: handleMutationSuccess(
      "Empleado actualizado",
      "Se actualizo el empleado correctamente.",
      (data) => {
        queryClient.invalidateQueries({ queryKey: ["empleado", empleadoId] });
        queryClient.invalidateQueries({ queryKey: ["empleados"] });
        queryClient.invalidateQueries({
          queryKey: ["sucursalEmpleado", empleadoId],
        });
        if (onClose) {
          onClose();
        } else {
          navigate(`/empleados/${data?.id ?? empleadoId}`);
        }
      }
    ),
  });

  const handlesub = (data) => {
    setSaving(true);
    if (isEdit) {
      doActualizar(data);
    } else {
      doInsertar(data);
    }
  };

  async function insertar(data) {
    const { documentExists, legajoExists } = await checkEmpleadoDuplicate({
      document_number: data.document_number,
      employee_id_number: data.employee_id_number,
    });

    // if (documentExists) {
    //   throw new Error("El numero de documento ya existe.");
    // }
    // if (legajoExists) {
    //   throw new Error("El numero de legajo ya existe.");
    // }

    const payload = {
      user_id: null,
      first_name: ConvertirCapitalize(data.first_name),
      last_name: ConvertirCapitalize(data.last_name),
      employee_id_number: data.employee_id_number, //numero de legajo
      document_type: data.document_type || "DNI",
      document_number: data.document_number,
      puesto_id: data.puesto_id,
      professional_number:
        requiresProfessionalNumber && data.is_registered
          ? data.professional_number
          : null,
      is_registered: data.is_registered ?? false,
      is_active: true,
      created_at: new Date().toISOString(),
      hire_date: data.hire_date || null,
    };

    const empleadoCreado = await createEmpleado(payload);

    if (data.sucursal_id && empleadoCreado?.id) {
      await insertSucursalEmpleado({
        empleado_id: empleadoCreado.id,
        sucursal_id: parseInt(data.sucursal_id, 10),
      });
    }

    return empleadoCreado;
  }

  async function actualizar(data) {
    const documentChanged = data.document_number !== empleado?.document_number;
    const legajoChanged = data.employee_id_number !== empleado?.employee_id_number;

    if (documentChanged || legajoChanged) {
      const { documentExists, legajoExists } = await checkEmpleadoDuplicate({
        document_number: documentChanged ? data.document_number : null,
        employee_id_number: legajoChanged ? data.employee_id_number : null,
        excludeId: empleadoId,
      });

      // if (documentExists) {
      //   throw new Error("El numero de documento ya existe.");
      // }
      // if (legajoExists) {
      //   throw new Error("El numero de legajo ya existe.");
      // }
    }

    const isActiveBool = String(data.is_active) === "true";
    const payload = {
      first_name: ConvertirCapitalize(data.first_name),
      last_name: ConvertirCapitalize(data.last_name),
      employee_id_number: data.employee_id_number,
      document_type: data.document_type || "DNI",
      document_number: data.document_number,
      puesto_id: data.puesto_id,
      professional_number:
        requiresProfessionalNumber && data.is_registered
          ? data.professional_number
          : null,
      is_registered: data.is_registered ?? false,
      is_active: isActiveBool,
      termination_date: isActiveBool ? null : data.termination_date || null,
      hire_date: data.hire_date || null,
    };

    const empleadoActualizado = await updateEmpleado(empleadoId, payload);

    if (data.sucursal_id && empleadoActualizado?.id) {
      await upsertSucursalEmpleado({
        empleado_id: empleadoActualizado.id,
        sucursal_id: parseInt(data.sucursal_id, 10),
      });
    }

    return empleadoActualizado;
  }

  function cancelar() {
    if (onClose) {
      onClose();
      return;
    }
    if (isEdit && empleadoId) {
      navigate(`/empleados/${empleadoId}`);
      return;
    }
    navigate("/");
  }

  if (saving) {
    return <Spinner1></Spinner1>;
  }

  const handleBackdropClick = (event) => {
    if (onClose && event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <Container $modal={isModal} onClick={handleBackdropClick}>
      <div className="sub-contenedor">
        <div className="headers">
          <section>
            <h1>{headerTitle}</h1>
          </section>
          {onClose && (
            <section>
              <span onClick={onClose}>x</span>
            </section>
          )}
        </div>
        <form className="formulario" onSubmit={handleSubmit(handlesub)}>
          <section className="form-subcontainer">
            <article>
              <InputText icono={<v.icononombre />}>
                <input
                  className="form__field"
                  type="text"
                  placeholder="nombre"
                  {...register("first_name", { required: true })}
                />
                <label className="form__label">nombre</label>
                {errors.first_name?.type === "required" && (
                  <p>Campo requerido</p>
                )}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.icononombre />}>
                <input
                  className="form__field"
                  type="text"
                  placeholder="apellido"
                  {...register("last_name", { required: true })}
                />
                <label className="form__label">apellido</label>
                {errors.last_name?.type === "required" && (
                  <p>Campo requerido</p>
                )}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconocodigobarras />}>
                <input
                  className="form__field"
                  type="text"
                  placeholder="Nro legajo"
                  {...register("employee_id_number", {
                    required: true,
                    pattern: /^[0-9]+$/,
                  })}
                />
                <label className="form__label">Nro legajo</label>
                {errors.employee_id_number?.type === "required" && (
                  <p>Campo requerido</p>
                )}
                {errors.employee_id_number?.type === "pattern" && (
                  <p>Solo numeros</p>
                )}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconocheck />}>
                <select
                  className="form__field"
                  {...register("is_registered", {
                    setValueAs: (value) => value === "true",
                  })}
                  defaultValue="false"
                >
                  <option value="false">No registrado</option>
                  <option value="true">Registrado</option>
                </select>
                <label className="form__label">empleado registrado</label>
              </InputText>
            </article>

            {isEdit && (
              <article>
                <InputText icono={<v.iconocheck />}>
                  <select
                    className="form__field"
                    {...register("is_active")}
                    defaultValue="true"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                  <label className="form__label">estado</label>
                </InputText>
              </article>
            )}

            {showTerminationDate && (
              <article>
                <InputText icono={<v.iconocheck />}>
                  <input
                    className="form__field"
                    type="date"
                    placeholder="fecha de finalizacion laboral"
                    {...register("termination_date", {
                      required: "La fecha de finalizacion es obligatoria.",
                    })}
                  />
                  <label className="form__label">fecha de finalizacion laboral</label>
                  {errors.termination_date?.message && (
                    <p>{errors.termination_date.message}</p>
                  )}
                </InputText>
              </article>
            )}

            <article>
              <InputText icono={<v.iconocodigointerno />}>
                <select
                  className="form__field"
                  {...register("document_type")}
                  defaultValue="DNI"
                >
                  <option value="DNI">DNI</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Otro">Otro</option>
                </select>
                <label className="form__label">tipo documento</label>
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoProfesional />}>
                <select
                  className="form__field"
                  {...register("area_id", {
                    required: true,
                    setValueAs: (value) => (value ? value : null),
                  })}
                  defaultValue=""
                  disabled={loadingAreas}
                >
                  <option value="" disabled>
                    {loadingAreas
                      ? "Cargando areas..."
                      : "Seleccionar area laboral"}
                  </option>
                  {dataAreas?.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
                <label className="form__label">area laboral</label>
                {errors.area_id?.type === "required" && <p>Campo requerido</p>}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconodocumento />}>
                <input
                  className="form__field"
                  type="text"
                  placeholder="Numero de documento"
                  {...register("document_number", {
                    required: true,
                    pattern: /^[0-9]+$/,
                  })}
                />
                <label className="form__label">Nro Documento</label>
                {errors.document_number?.type === "required" && (
                  <p>Campo requerido</p>
                )}
                {errors.document_number?.type === "pattern" && (
                  <p>Solo numeros</p>
                )}
              </InputText>
            </article>

            

            <article>
              <InputText icono={<v.iconoProfesional />}>
                <select
                  className="form__field"
                  {...register("puesto_id", {
                    required: true,
                    setValueAs: (value) => (value ? value : null),
                  })}
                  defaultValue=""
                  disabled={!areaId || loadingPuestos}
                >
                  <option value="" disabled>
                    {loadingPuestos
                      ? "Cargando puestos..."
                      : "Seleccionar puesto laboral"}
                  </option>
                  {dataPuestos?.map((puesto) => (
                    <option key={puesto.id} value={puesto.id}>
                      {puesto.name}
                    </option>
                  ))}
                </select>
                <label className="form__label">puesto laboral</label>
                {errors.puesto_id?.type === "required" && (
                  <p>Campo requerido</p>
                )}
              </InputText>
            </article>

            

            {requiresProfessionalNumber && (
              <article>
                <InputText icono={<v.iconocodigobarras />}>
                  <input
                    className="form__field"
                    type="text"
                    placeholder="Nro matricula"
                    {...register("professional_number", {
                      validate: (value) => {
                        if (isRegistered && requiresProfessionalNumber) {
                          return value?.trim()
                            ? true
                            : "La matricula es obligatoria.";
                        }
                        return true;
                      },
                    })}
                  />
                  <label className="form__label">Nro matricula</label>
                  {errors.professional_number?.message && (
                    <p>{errors.professional_number.message}</p>
                  )}
                </InputText>
              </article>
            )}

            

            <article>
              <InputText icono={<v.iconoubicacion />}>
                <select
                  className="form__field"
                  {...register("sucursal_id", { required: true })}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Seleccionar sucursal
                  </option>
                  {dataSucursales?.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.name}
                    </option>
                  ))}
                </select>
                <label className="form__label">sucursal</label>
                {errors.sucursal_id?.type === "required" && (
                  <p>Campo requerido</p>
                )}
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconocheck />}>
                <input
                  className="form__field"
                  type="date"
                  placeholder="fecha ingreso"
                  {...register("hire_date")}
                />
                <label className="form__label">fecha ingreso</label>
              </InputText>
            </article>

            <div className="acciones">
              <Btn1
                icono={<v.iconocerrar />}
                titulo="Cancelar"
                bgcolor="rgb(183, 183, 182)"
                funcion={cancelar}
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
      </div>
    </Container>
  );
}

const Container = styled.div`
  padding: 24px 16px;
  display: flex;
  width: 100%;
  min-height: calc(100dvh - 30px);
  align-items: center;
  justify-content: center;

  ${({ $modal }) =>
    $modal
      ? `
    position: fixed;
    top: 0;
    left: 0;
    min-height: 100vh;
    background-color: rgba(10, 9, 9, 0.5);
    z-index: 1000;
  `
      : ""}

  @media (max-width: ${v.bplisa}) {
    padding: 16px 12px;
  }

  @media (min-width: ${v.bplisa}) {
    padding: 28px 20px;
  }

  ${({ $modal }) =>
    $modal
      ? `
    @media (max-width: ${v.bplisa}) {
      align-items: flex-start;
      padding: 0;
    }
  `
      : ""}

  .sub-contenedor {
    position: relative;
    width: min(720px, 100%);
    max-width: 100%;
    border-radius: 18px;
    background: ${({ theme }) => theme.bgtotal};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.25);
    padding: 16px 18px 20px 18px;

    ${({ $modal }) =>
      $modal
        ? `
      max-height: calc(100vh - 32px);
      overflow-y: auto;
    `
        : ""}

    @media (min-width: ${v.bplisa}) {
      padding: 18px 26px 24px 26px;
      border-radius: 20px;
    }

    @media (max-width: ${v.bplisa}) {
      border-radius: 16px;
      padding: 14px 14px 18px 14px;
    }

    ${({ $modal }) =>
      $modal
        ? `
      @media (max-width: ${v.bplisa}) {
        width: 100%;
        height: 100vh;
        max-height: none;
        border-radius: 0;
        padding: 16px 16px 20px 16px;
      }
    `
        : ""}

    .headers {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h1 {
        font-size: 18px;
        font-weight: 500;
      }

      @media (min-width: ${v.bplisa}) {
        margin-bottom: 20px;

        h1 {
          font-size: 20px;
        }
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

        @media (min-width: ${v.bpbart}) {
          gap: 20px 24px;
        }
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
