import styled from "styled-components";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Title, InputText2, Btn1, Footer, useAuthStore } from "../../index";
import { v } from "../../styles/variables";
import { Device } from "../../styles/breakpoints";

export function RegisterTemplate() {
  const navigate = useNavigate();
  const { registerUser, loading, error } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validar nombre
    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido";
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Email inválido";
    }

    // Validar contraseña
    if (!formData.password) {
      errors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirma tu contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await registerUser(
      formData.email,
      formData.password,
      formData.name
    );

    if (result.success) {
      await Swal.fire({
        icon: "success",
        title: "¡Registro exitoso!",
        text: "Tu cuenta ha sido creada. Por favor verifica tu email.",
        confirmButtonText: "Aceptar",
      });
      navigate("/");
    } else {
      Swal.fire({
        icon: "error",
        title: "Error al registrar",
        text: result.error || "Ocurrió un error. Intenta nuevamente.",
        confirmButtonText: "Aceptar",
      });
    }
  };

  return (
    <Container>
      <div className="card">
        <ContentLogo>
          <img src={v.logo} alt="Logo" />
          <span>
            Clínica de Salud Mental <br /> Dr. Gutierrez Walker
          </span>
        </ContentLogo>
        <Title $paddingbottom="20px">Crear cuenta</Title>
        <form onSubmit={handleSubmit}>
          <InputText2>
            <input
              className="form__field"
              placeholder="Nombre completo"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            {validationErrors.name && (
              <ErrorText>{validationErrors.name}</ErrorText>
            )}
          </InputText2>

          <InputText2>
            <input
              className="form__field"
              placeholder="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            {validationErrors.email && (
              <ErrorText>{validationErrors.email}</ErrorText>
            )}
          </InputText2>

          <InputText2>
            <input
              className="form__field"
              placeholder="Contraseña"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
            {validationErrors.password && (
              <ErrorText>{validationErrors.password}</ErrorText>
            )}
          </InputText2>

          <InputText2>
            <input
              className="form__field"
              placeholder="Confirmar contraseña"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {validationErrors.confirmPassword && (
              <ErrorText>{validationErrors.confirmPassword}</ErrorText>
            )}
          </InputText2>

          {error && <ErrorText>{error}</ErrorText>}

          <Btn1
            tipo="submit"
            titulo={loading ? "REGISTRANDO..." : "REGISTRAR"}
            bgcolor="rgb(143, 191, 250)"
            color="255,255,255"
            width="100%"
            disabled={loading}
          />

          <LoginLink onClick={() => navigate("/")}>
            ¿Ya tienes cuenta? <strong>Inicia sesión</strong>
          </LoginLink>
        </form>
      </div>
      <Footer />
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
  color: #ff4444;
  font-size: 12px;
  display: block;
  margin-top: 5px;
  text-align: left;
`;

const LoginLink = styled.p`
  margin-top: 20px;
  cursor: pointer;
  color: ${({ theme }) => theme.text};

  &:hover {
    color: rgb(143, 191, 250);
  }

  strong {
    color: rgb(143, 191, 250);
  }
`;
