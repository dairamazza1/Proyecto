import styled from "styled-components";
import { BeatLoader } from "react-spinners";

export function Spinner1() {
  return (
    <Container>
      <BeatLoader color="var(--color-accent-strong)" size={60} />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100dvh;
`;
