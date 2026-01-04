import styled from "styled-components";
import { useAuthStore } from "../../context/AuthStoreWithPermissions";

export function HomeTemplate() {
  const { cerrarSesion } = useAuthStore();

  return (
    <Container>
      <span>Home template</span>
      <button onClick={cerrarSesion}>cerrar</button>
    </Container>
  );
}
const Container = styled.div`
  height: 100dvh;
`;
