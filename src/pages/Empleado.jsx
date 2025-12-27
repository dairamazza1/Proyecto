import styled from "styled-components";
import { Title } from "../index";
import { useParams } from "react-router-dom";

export function Empleado() {
  const { id } = useParams();

  return (
    <Container>
      <Title>Empleado</Title>
      <p>{id ? `Detalle del empleado ${id}` : "Nuevo empleado"}</p>
    </Container>
  );
}

const Container = styled.div`
  height: calc(100dvh - 30px);
  padding: 15px;
  display: grid;
  gap: 12px;
`;
