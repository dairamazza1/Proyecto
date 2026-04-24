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

const EMPLEADO_STATUS_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "inactive", label: "Inactivos" },
];

export function EmpleadosTemplate() {
  // const { cerrarSesion } = useAuthStore();
  const navigate = useNavigate();
  const { dataEmpleados, setBuscador, estadoFiltro, setEstadoFiltro } =
    useEmpleadosStore();
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
        <div className="titleBlock">
          <Title>Empleados</Title>
          <div
            className="estado-filter"
            aria-label="Filtrar empleados por estado"
          >
            {EMPLEADO_STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={estadoFiltro === filter.id ? "active" : ""}
                onClick={() => setEstadoFiltro(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
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
          {canCreate('empleados') && (
            <div className="btn-nuevo">
              <Btn1
                funcion={nuevoRegistro}
                bgcolor={v.colorPrincipal}
                titulo="Agregar empleado"
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

  .titleBlock {
    display: grid;
    gap: 8px;
    align-items: start;
  }

  .acciones {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: nowrap;
    justify-content: flex-end;
    width: 100%;
    @media ${Device.tablet} {
      width: auto;
    }
    @media ${DeviceMax.tablet} {
      flex-wrap: wrap;
      justify-content: stretch;
      gap: 10px;
    }
  }
  .selector-sucursal {
    width: min(260px, 100%);
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
  .estado-filter {
    display: inline-flex;
    align-items: center;
    height: 40px;
    padding: 3px;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 999px;
    background: ${({ theme }) => theme.bgtotal};
    flex: 0 0 auto;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);

    button {
      min-width: 70px;
      height: 32px;
      padding: 0 10px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: ${({ theme }) => theme.text};
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;

      &.active {
        background: ${({ theme }) => theme.bg};
        color: ${({ theme }) => theme.color1};
        box-shadow: var(--shadow-elev-1);
      }
    }

    @media ${DeviceMax.tablet} {
      width: 100%;
      height: 42px;

      button {
        flex: 1;
      }
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
