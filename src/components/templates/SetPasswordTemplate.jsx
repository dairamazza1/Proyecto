import styled from "styled-components";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Btn1, InputText2, Title } from "../../index";
import { supabase } from "../../supabase/supabase.config.jsx";
import { v } from "../../styles/variables";
import { Device } from "../../styles/breakpoints";

export function SetPasswordTemplate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setHasSession(Boolean(data?.session));
      setSessionReady(true);
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setHasSession(Boolean(session));
        setSessionReady(true);
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.password) {
      nextErrors.password = "Ingresa una contrasena";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Minimo 6 caracteres";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Confirma la contrasena";
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Las contrasenas no coinciden";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });
      if (error) throw error;

      try {
        await supabase.functions.invoke("accept_invitation");
      } catch (invokeError) {
        console.warn("No se pudo actualizar la invitacion", invokeError);
      }

      await Swal.fire({
        icon: "success",
        title: "Contrasena actualizada",
        text: "Ahora puedes iniciar sesion.",
        confirmButtonText: "Aceptar",
      });

      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: error?.message || "Error al actualizar contrasena.",
        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="card">
        <ContentLogo>
          <img src={v.logo} alt="Logo" />
          <span>
            Clinica de Salud Mental <br /> Dr. Gutierrez Walker
          </span>
        </ContentLogo>
        <Title $paddingbottom="20px">Definir contrasena</Title>

        {!sessionReady ? (
          <p className="status">Cargando sesion...</p>
        ) : !hasSession ? (
          <div className="status">
            <p>El enlace no es valido o ya expiro.</p>
            <Btn1
              tipo="button"
              titulo="Volver a login"
              bgcolor={v.colorPrincipal}
              color="255,255,255"
              width="100%"
              funcion={() => navigate("/login")}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <InputText2>
              <input
                className="form__field"
                placeholder="Nueva contrasena"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <ErrorText>{errors.password}</ErrorText>}
            </InputText2>

            <InputText2>
              <input
                className="form__field"
                placeholder="Confirmar contrasena"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <ErrorText>{errors.confirmPassword}</ErrorText>
              )}
            </InputText2>

            <Btn1
              tipo="submit"
              titulo={loading ? "GUARDANDO..." : "GUARDAR"}
              bgcolor={v.colorPrincipal}
              color="255,255,255"
              width="100%"
              disabled={loading}
            />
          </form>
        )}
      </div>
    </Container>
  );
}

const Container = styled.div`
  height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex-direction: column;
  padding: 0 10px;
  color: ${({ theme }) => theme.text};

  .card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    width: 100%;
    margin: 20px;
    @media ${Device.tablet} {
      width: 400px;
    }
  }

  .status {
    display: grid;
    gap: 16px;
  }
`;

const ContentLogo = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px;
  span {
    font-weight: 700;
  }
  img {
    width: 10%;
  }
`;

const ErrorText = styled.span`
  color: var(--color-danger);
  font-size: 12px;
  display: block;
  margin-top: 5px;
  text-align: left;
`;
