import styled from "styled-components";
import { Title, Btn1, Buscador, TablaEmpleados, useEmpleadosStore } from "../../index";
import { v } from "../../styles/variables";
import { useNavigate } from "react-router-dom";

export function EmpleadosTemplate() {
  const navigate = useNavigate();
  const { dataEmpleados, setBuscador } = useEmpleadosStore();

  function nuevoRegistro() {
    navigate("/empleados/nuevo");
  }

  return (
    <Container>
      <section className="header">
        <Title>Empleados</Title>
        <div className="acciones">
          <div className="buscador">
            <Buscador setBuscador={setBuscador}></Buscador>
          </div>
          <Btn1
            funcion={nuevoRegistro}
            bgcolor={v.colorPrincipal}
            titulo="nuevo"
            icono={<v.iconoagregar />}
          ></Btn1>
        </div>
      </section>
      <section className="main">
        {dataEmpleados?.length ? (
          <TablaEmpleados data={dataEmpleados} />
        ) : (
          <EmptyState>No hay empleados para mostrar.</EmptyState>
        )}
      </section>
    </Container>
  );
}

const Container = styled.div`
  height: calc(100dvh - 30px);
  padding: 15px;
  display: grid;
  grid-template:
    "header" 80px
    "main" auto;

  .header {
    grid-area: header;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;
  }
  .acciones {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;
    justify-content: flex-end;
    width: 100%;
    @media (min-width: ${v.bpbart}) {
      width: auto;
    }
  }
  .buscador {
    width: min(340px, 100%);
  }
  .main {
    grid-area: main;
  }
`;

const EmptyState = styled.div`
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
  border-radius: 16px;
  border: 2px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.text};
`;
