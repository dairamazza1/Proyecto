import styled from "styled-components";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Title,
  InputText2,
  Btn1,
  Footer,
  useAuthStore,
} from "../../index";
import { v } from "../../styles/variables";
import { Device } from "../../styles/breakpoints";

export function LoginTemplate() {
  const navigate = useNavigate();
  const { loginEmailPassword, loading, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        text: "Por favor ingresa email y contraseña",
        confirmButtonText: "Aceptar"
      });
      return;
    }

    const result = await loginEmailPassword(formData.email, formData.password);

    if (result.success) {
      navigate("/home");
    } else {
      Swal.fire({
        icon: "error",
        title: "Error al iniciar sesión",
        text: result.error || "Credenciales incorrectas",
        confirmButtonText: "Aceptar"
      });
    }
  };

  return (
    <Container>
      <div className="card">
        <ContentLogo>
          <img src={v.logo} alt="Logo" />
          <span>Proyecto de prueba</span>
        </ContentLogo>
        <Title $paddingbottom="20px">Ingresar</Title>
        <form onSubmit={handleSubmit}>
          <InputText2>
            <input
              className="form__field"
              placeholder="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
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
          </InputText2>
          
          {error && <ErrorText>{error}</ErrorText>}
          
          <Btn1
            tipo="submit"
            titulo={loading ? "INGRESANDO..." : "INGRESAR"}
            bgcolor="rgb(143, 191, 250)"
            color="255,255,255"
            width="100%"
            disabled={loading}
          />
          
          <RegisterLink onClick={() => navigate("/register")}>
            ¿No tienes cuenta? <strong>Regístrate</strong>
          </RegisterLink>
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
  font-size: 14px;
  display: block;
  margin-bottom: 10px;
`;

const RegisterLink = styled.p`
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
