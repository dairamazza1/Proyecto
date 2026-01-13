import styled from "styled-components";
import {
  Title,
  Btn1,
  Buscador,
  TablaEmpleados,
  useEmpleadosStore,
  useSucursalesStore,
} from "../../index";
import { usePermissions } from "../../hooks/usePermissions";
import { v } from "../../styles/variables";
import { Device, DeviceMax } from "../../styles/breakpoints";
import { useNavigate } from "react-router-dom";
// import { useAuthStore } from "../../store/AuthStore";


export function EmpleadosTemplate() {
  // const { cerrarSesion } = useAuthStore();
  const navigate = useNavigate();
  const { dataEmpleados, setBuscador } = useEmpleadosStore();
  const { dataSucursales, sucursalSeleccionada, setSucursalSeleccionada } = useSucursalesStore();
  
  // Hook de permisos
  const { canCreate } = usePermissions();

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
              <option value="">Sucursales</option>
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
          {canCreate('empleados') && (
            <div className="btn-nuevo">
              <Btn1
                funcion={nuevoRegistro}
                bgcolor={v.colorPrincipal}
                titulo="nuevo"
                icono={<v.iconoagregar />}
              ></Btn1>
            </div>
          )}
        </div>
      </section>
      <ResultsCard>
      <section className="main">
        {dataEmpleados?.length ? (
          <TablaEmpleados data={dataEmpleados} />
        ) : (
          <EmptyState>No hay empleados para mostrar.</EmptyState>
        )}
      </section>
    </ResultsCard>
    </Container>
  );
}

const ResultsCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 18px 20px 28px;
  box-shadow: var(--shadow-elev-1);

  @media ${DeviceMax.mobile} {
    background: transparent;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
  }
`;

const Container = styled.div`
  min-height: calc(100dvh - 30px);
  padding: 15px;
  padding-bottom: 28px;
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
    padding: 12px;

    @media ${DeviceMax.tablet} {
      align-items: stretch;
    }
  }

  .acciones {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-wrap: nowrap;
    justify-content: flex-end;
    width: 100%;
    @media ${Device.tablet} {
      width: auto;
    }
    @media ${DeviceMax.tablet} {
      justify-content: stretch;
      gap: 10px;
    }
  }
  .selector-sucursal {
    width: min(240px, 100%);
    @media ${DeviceMax.tablet} {
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
    @media ${DeviceMax.tablet} {
      width: 100%;
    }
  }
  .btn-nuevo {
    display: flex;
    align-items: stretch;

    > button {
      height: 60px;
      transform: none;
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
