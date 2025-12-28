import { useState, useEffect } from "react";
import styled from "styled-components";
import { v } from "../styles/variables";
import {
  InputText,
  Btn1,
  Spinner1,
  useCompanyStore,
  useEmpleadosStore,
  useEmpresasStore,
  ConvertirCapitalize,
} from "../index";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export function RegistrarEmpleados() {
  const navigate = useNavigate();
  const { dataCompany } = useCompanyStore();
  const { createEmpleado } = useEmpleadosStore();
  const { dataEmpresas, loadEmpresas } = useEmpresasStore();
  const [saving, setSaving] = useState(false);

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      document_type: "DNI",
      empresa_id: "",
    },
  });

  useEffect(() => {
    loadEmpresas();
  }, []);

  const { mutate: doInsertar } = useMutation({
    mutationFn: insertar,
    mutationKey: "insertar empleados",
    onError: (err) => {
      const isUnique = err?.code === "23505";
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: isUnique
          ? "El Nro Legajo ya existe."
          : err?.message || "Error al registrar empleado.",
      });
      setSaving(false);
    },
    onSuccess: () => {
      setSaving(false);
      Swal.fire({
        icon: "success",
        title: "Empleado registrado",
        text: "Se registro el empleado correctamente.",
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
    if (!data.empresa_id) {
      throw new Error("Debe seleccionar una empresa.");
    }
    const payload = {
      empresa_id: parseInt(data.empresa_id),
      user_id: null,
      first_name: ConvertirCapitalize(data.first_name),
      last_name: ConvertirCapitalize(data.last_name),
      employee_id_number: data.employee_id_number, //número de legajo
      document_type: data.document_type || "DNI",
      document_number: data.document_number,
      employee_type: data.employee_type,
      is_registered: false,
      is_active: true,
      created_at: new Date().toISOString(),
      hire_date: data.hire_date || null,
    };
    return createEmpleado(payload);
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
              <InputText icono={<v.iconoempresa />}>
                <select
                  className="form__field"
                  {...register("empresa_id", { required: true })}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Seleccionar empresa
                  </option>
                  {dataEmpresas?.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.name}
                    </option>
                  ))}
                </select>
                <label className="form__label">empresa</label>
                {errors.empresa_id?.type === "required" && (
                  <p>Campo requerido</p>
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
                  {...register("employee_type", { required: true })}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Seleccionar tipo
                  </option>
                  <option value="rrhh">RRHH</option>
                  <option value="employee">Empleado</option>
                </select>
                <label className="form__label">tipo empleado</label>
                {errors.employee_type?.type === "required" && (
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
  padding: 30px 20px;
  display: flex;
  width: 100%;
  min-height: calc(100dvh - 30px);
  align-items: center;
  justify-content: center;

  .sub-contenedor {
    position: relative;
    width: 520px;
    max-width: 90%;
    border-radius: 20px;
    background: ${({ theme }) => theme.bgtotal};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
    padding: 13px 36px 20px 36px;

    .headers {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h1 {
        font-size: 20px;
        font-weight: 500;
      }
    }
    .formulario {
      .form-subcontainer {
        gap: 20px;
        display: flex;
        flex-direction: column;
      }
    }
  }

  .acciones {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
`;
