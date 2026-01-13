import styled from "styled-components";
import { InvitacionesSection, Title } from "../../index";

export function InvitacionesConfigTemplate() {
  return (
    <Container>
      <Header>
        <Title>Invitar empleado</Title>
        <p>Invita empleados por email y revisa su estado.</p>
      </Header>
      <InvitacionesSection />
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
