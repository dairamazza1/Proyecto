import styled from "styled-components";
import { NotificacionesSection, Title } from "../../index";

export function NotificacionesTemplate() {
  return (
    <Container>
      <Header>
        <Title>Notificaciones</Title>
        <p>Seguimiento de solicitudes y eventos pendientes.</p>
      </Header>
      <NotificacionesSection />
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
  display: grid;
  gap: 10px;

  p {
    margin: 0;
    color: ${({ theme }) => theme.textsecundary};
    font-weight: 500;
  }
`;
