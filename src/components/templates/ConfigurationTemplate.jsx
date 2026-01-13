import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { Btn1, HomeCards, Title, v } from "../../index";
import { useAuthStore } from "../../context/AuthStoreWithPermissions";

export function ConfigurationTemplate() {
  const navigate = useNavigate();
  const { cerrarSesion } = useAuthStore();

  const cards = [
    {
      title: "Invitar empleado",
      description: "Invita empleados por email y revisa su estado.",
      to: "/configuracion/invitaciones",
      icon: v.iconoagregar,
    },
  ];

  const handleLogout = async () => {
    await cerrarSesion();
    navigate("/login");
  };

  return (
    <Container>
      <Header>
        <div className="titleGroup">
          <Title>Configuración</Title>
          <p>Accesos rápidos para administrar tu cuenta.</p>
        </div>

        <div className="actions">
          <Btn1
            funcion={handleLogout}
            bgcolor={v.colorPrincipal}
            titulo="Cerrar sesión"
            icono={<v.iconoCerrarSesion />}
            tipo="button"
          />
        </div>
      </Header>
      <HomeCards cards={cards} />
    </Container>
  );
}
const Container = styled.div`
  background-color: ${({ theme }) => theme.bgtotal};
  min-height: calc(100dvh - 30px);
  padding: 24px;
  display: grid;
  gap: 16px;
  align-content: start;
  align-items: start;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;

  .titleGroup {
    display: grid;
    gap: 10px;
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.textsecundary};
    font-weight: 500;
  }
`;
