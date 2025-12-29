import styled from "styled-components";
import { Title, Btn1, Buscador, TablaEmpleados, useEmpleadosStore, useSucursalesStore } from "../../index";
import { v } from "../../styles/variables";
import { useNavigate } from "react-router-dom";
// import { useAuthStore } from "../../store/AuthStore";


export function EmpleadosTemplate() {
  // const { cerrarSesion } = useAuthStore();
  const navigate = useNavigate();
  const { dataEmpleados, setBuscador } = useEmpleadosStore();
  const { dataSucursales, sucursalSeleccionada, setSucursalSeleccionada } = useSucursalesStore();

  function nuevoRegistro() {
    navigate("/empleados/nuevo");
  }

  const handleSucursalChange = (e) => {
    const sucursalId = e.target.value ? parseInt(e.target.value) : null;
    setSucursalSeleccionada(sucursalId);
  };

  return (
    <Container>
      {/* <button onClick={cerrarSesion}>cerrar</button> */}
      <section className="header">
        <Title>Empleados</Title>
        <div className="acciones">
          <div className="selector-sucursal">
            <select 
              value={sucursalSeleccionada || ""} 
              onChange={handleSucursalChange}
              className="select-sucursal"
            >
              <option value="">Todas las sucursales</option>
              {dataSucursales?.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.name}
                </option>
              ))}
            </select>
          </div>
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
    "header" auto
    "main" auto;

  .header {
    grid-area: header;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;

    @media (max-width: ${v.bpbart}) {
      align-items: stretch;
    }
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
    @media (max-width: ${v.bpbart}) {
      justify-content: stretch;
      gap: 10px;
    }
  }
  .selector-sucursal {
    width: min(240px, 100%);
    @media (max-width: ${v.bpbart}) {
      width: 100%;
    }
    
    .select-sucursal {
      width: 100%;
      height: 60px;
      padding: 0 15px;
      border-radius: 10px;
      border: 2px solid ${({ theme }) => theme.color2};
      background: ${({ theme }) => theme.bgtotal};
      color: ${({ theme }) => theme.text};
      font-size: 18px;
      cursor: pointer;
      outline: none;
      
      &:focus {
        border-color: ${({ theme }) => theme.color1};
      }
    }
  }
  .buscador {
    width: min(340px, 100%);
    @media (max-width: ${v.bpbart}) {
      width: 100%;
    }
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
