import { useEffect, useState } from "react";
import styled from "styled-components";
import { v } from "../styles/variables";
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
} from "../index";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export function RegistrarEmpleados() {
  const navigate = useNavigate();
  const { dataCompany } = useCompanyStore();
  const { createEmpleado } = useEmpleadosStore();
  const { showSucursales, dataSucursales } = useSucursalesStore();
  const [saving, setSaving] = useState(false);

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
    },
  });

  const areaId = watch("area_id");
  const puestoId = watch("puesto_id");
  const isRegistered = watch("is_registered");

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

const { mutate: doInsertar } = useMutation({
  mutationFn: insertar,
  mutationKey: "insertar empleados",
  onError: (err) => {
    //console.error("Error insert empleado:", err);

    let text = err?.message || "Error al registrar empleado.";

    if (err?.code === "23505") {
      // En Supabase suele venir en err.message algo como:
      // 'duplicate key value violates unique constraint "empleados_document_number_key"'
      const raw = `${err?.message ?? ""} ${err?.details ?? ""}`.toLowerCase();

      if (raw.includes("document_number") || raw.includes("empleados_document_number")) {
        text = "El número de documento ya existe.";
      } else if (raw.includes("employee_id_number") || raw.includes("empleados_employee_id_number")) {
        text = "El número de legajo ya existe.";
      } else if (raw.includes("professional_number") || raw.includes("empleados_professional_number")) {
        text = "La matrícula ya existe.";
      } else {
        text = "Ya existe un empleado con alguno de estos datos.";
      }
    }

    Swal.fire({
      icon: "error",
      title: "Oops...",
      text,
    });

    setSaving(false);
  },
  onSuccess: () => {
    setSaving(false);
    Swal.fire({
      icon: "success",
      title: "Empleado registrado",
      text: "Se registró el empleado correctamente.",
    });
    reset();
    navigate("/");
  },
});

  const handlesub = (data) => {
    setSaving(true);
    doInsertar(data);
  };

  async function insertar(data) {
    const payload = {
      user_id: null,
      first_name: ConvertirCapitalize(data.first_name),
      last_name: ConvertirCapitalize(data.last_name),
      employee_id_number: data.employee_id_number, //número de legajo
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

    // Crear el empleado
    const empleadoCreado = await createEmpleado(payload);

    // Si se seleccionó una sucursal, crear la relación
    if (data.sucursal_id && empleadoCreado?.id) {
      await insertSucursalEmpleado({
        empleado_id: empleadoCreado.id,
        sucursal_id: parseInt(data.sucursal_id),
      });
    }

    return empleadoCreado;
  }

  function cancelar() {
    navigate("/");
  }

  if (saving) {
    return <Spinner1></Spinner1>;
  }

  return (
    <Container>
      <div className="sub-contenedor">
        <div className="headers">
          <section>
            <h1>Registrar empleado</h1>
          </section>
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
                  placeholder="Número de documento"
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

            {requiresProfessionalNumber && (
              <article>
                <InputText icono={<v.iconocodigobarras />}>
                  <input
                    className="form__field"
                    type="text"
                    placeholder="Nro matricula"
                    // required={isRegistered && requiresProfessionalNumber}
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

  @media (min-width: ${v.bplisa}) {
    padding: 28px 20px;
  }

  .sub-contenedor {
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

      @media (min-width: ${v.bplisa}) {
        margin-bottom: 20px;

        h1 {
          font-size: 20px;
        }
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
