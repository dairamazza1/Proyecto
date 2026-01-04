import styled from "styled-components";
import { HomeCards, Title, v } from "../../index";

export function HomeTemplate({ displayName = "Usuario" }) {
  const cards = [
    {
      title: "Empleados",
      description: "Gestiona el listado y perfiles del personal.",
      to: "/empleados",
      icon: v.iconoempresa,
    },
    {
      title: "Reportes",
      description: "Consulta resumenes por vacaciones y licencias.",
      to: "/reportes",
      icon: v.iconoreportes,
    },
    {
      title: "Mi perfil",
      description: "Revisa tus datos y solicitudes.",
      to: "/perfil",
      icon: v.iconoUser,
    },
  ];

  return (
    <Container>
      <Header>
        <Title>Bienvenido {displayName}</Title>
        <p>Accesos rapidos para continuar tu trabajo.</p>
      </Header>
      <HomeCards cards={cards} />
    </Container>
  );
}

const Container = styled.div`
  min-height: calc(100dvh - 30px);
  padding: 24px;
  display: grid;
  gap: 24px;
  background: ${({ theme }) => theme.bgtotal};
`;

const Header = styled.header`
  display: grid;
  gap: 10px;

  p {
    margin: 0;
    color: ${({ theme }) => theme.textsecundary};
    font-weight: 500;
  }
`;
