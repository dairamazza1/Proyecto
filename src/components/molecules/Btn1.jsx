import styled from "styled-components";
import { Icono } from "../../index";
export function Btn1({
  funcion,
  tipo,
  titulo,
  bgcolor,
  icono,
  url,
  color,
  disabled,
  width,
}) {
  return (
    <Container
      $width={width}
      disabled={disabled}
      $color={color}
      type={tipo}
      $bgcolor={bgcolor}
      onClick={funcion}
    >
      <section className="content">
        <Icono $color={color}>{icono}</Icono>
        {titulo && (
          <span className="btn">
            {url ? (
              <a href={url} target="_blank" rel="noreferrer">
                {titulo}
              </a>
            ) : (
              <span>{titulo}</span>
            )}
          </span>
        )}
      </section>
    </Container>
  );
}
const Container = styled.button`
  font-weight: 700;
  display: flex;
  font-size: 15px;
  padding: 10px 25px;
  border-radius: 16px;
  background-color: ${(props) => props.$bgcolor};
  border: 2px solid var(--border-strong);
  border-bottom: 5px solid var(--border-strong);
  transform: translate(0, -3px);
  cursor: pointer;
  transition: 0.2s;
  transition-timing-function: linear;
  color: ${({ theme }) => theme.text};
  align-items: center;
  justify-content: center;
  width: ${(props) => props.$width};
  .content {
    display: flex;
    gap: 12px;
  }
  &:active {
    transform: translate(0, 0);
    border-bottom: 2px solid var(--border-strong);
  }
  &[disabled] {
    background-color: var(--bg-surface-muted);
    color: var(--text-secondary);
    border-color: var(--border-subtle);
    cursor: no-drop;
    box-shadow: none;
  }
`;
