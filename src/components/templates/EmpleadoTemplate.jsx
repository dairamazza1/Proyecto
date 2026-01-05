import { useState } from "react";
import styled from "styled-components";
import {
  Btn1,
  RegistrarEmpleados,
  Title,
  VacacionesSection,
  LicenciasSection,
  CambiosSection,
  SancionesSection,
} from "../../index";
import { usePermissions } from "../../hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import { v } from "../../styles/variables";
import { Device, DeviceMax } from "../../styles/breakpoints";

export function EmpleadoTemplate({ id, empleado, isError, sucursalEmpleado }) {
  const navigate = useNavigate();
  const [openEditar, setOpenEditar] = useState(false);
  const [activeTab, setActiveTab] = useState("vacaciones");
  
  // Hook de permisos
  const { canUpdate, isEmployee } = usePermissions();
  
  const fullName = [empleado?.first_name, empleado?.last_name]
    .filter(Boolean)
    .join(" ");
  const legajo =
    empleado?.employee_id_number ?? empleado?.document_number ?? empleado?.id ?? "-";
  const documentInfo = empleado?.document_number
    ? `${empleado?.document_type ?? "Doc"} ${empleado?.document_number}`
    : "-";
  const hireDate = formatDate(empleado?.hire_date);
  const statusLabel = empleado?.is_active ? "Activo" : "Inactivo";

  const terminationDate = formatDate(empleado?.termination_date);

  return (
    <Container>
      <Header>
        <div className="titleGroup">
          <Title>Empleado</Title>
          <h2>{fullName ? `Perfil Profesional de ${fullName}` : "-"}</h2>
        </div>
        {id && empleado && (
          <div className="headerActions">
            <StatusPill className={empleado?.is_active ? "activo" : "inactivo"}>
              Estado: {statusLabel}
            </StatusPill>
            {canUpdate('empleados') && (
              <Btn1
                icono={<v.iconeditarTabla />}
                titulo="Editar"
                bgcolor="#99a6ce"
                funcion={() => setOpenEditar(true)}
              />
            )}
          </div>
        )}
      </Header>

      {!id && <EmptyState>Nuevo empleado</EmptyState>}

      {id && isError && (
        <EmptyState>No se pudo cargar la informacion del empleado.</EmptyState>
      )}

      {id && empleado && (
        <>
          {/* Mensaje informativo para empleados */}
          {isEmployee() && (
            <InfoBanner>
              📖 Estás en modo solo lectura. Contacta a RRHH para modificaciones.
            </InfoBanner>
          )}
          
          <InfoCard>
            <InfoGrid>
              <InfoItem>
                <span className="label">N° de Legajo</span>
                <span className="value">{legajo}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">Nombre</span>
                <span className="value">{empleado?.first_name ?? "-"}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">Apellido</span>
                <span className="value">{empleado?.last_name ?? "-"}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">Documento</span>
                <span className="value">{documentInfo}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">N° de teléfono</span>
                <span className="value">{empleado?.telephone ?? "-"}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">Puesto</span>
                <span className="value">{empleado?.puesto?.name ?? "-"}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">N° de Matricula</span>
                <span className="value">{empleado?.professional_number ?? "-"}</span>
              </InfoItem>

              <InfoItem>
                <span className="label">Empleado Registrado</span>
                <span className="value">{empleado?.is_registered ? "Si" : "No"}</span>
              </InfoItem>
              
              <InfoItem>
                <span className="label">Fecha ingreso</span>
                <span className="value">{hireDate}</span>
              </InfoItem>
              
              {!empleado?.is_active && (
                <InfoItem>
                  <span className="label">Fecha de finalizacion laboral</span>
                  <span className="value">{terminationDate}</span>
                </InfoItem>
              )}
              
            </InfoGrid>
          </InfoCard>

          <Tabs>
            <button
              className={`tab ${activeTab === "vacaciones" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("vacaciones")}
            >
              Vacaciones
            </button>
            <button
              className={`tab ${activeTab === "licencias" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("licencias")}
            >
              Licencias
            </button>
            <button
              className={`tab ${activeTab === "cambios" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("cambios")}
            >
              Cambios de turnos
            </button>
            <button
              className={`tab ${activeTab === "sanciones" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("sanciones")}
            >
              Sanciones
            </button>
          </Tabs>

          <ResultsCard>
            {activeTab === "vacaciones" && (
              <VacacionesSection empleado={empleado} empleadoId={id} embedded />
            )}
            {activeTab === "licencias" && (
              <LicenciasSection empleadoId={id} embedded />
            )}
            {activeTab === "cambios" && (
              <CambiosSection empleadoId={id} embedded />
            )}
            {activeTab === "sanciones" && (
              <SancionesSection empleadoId={id} embedded />
            )}
          </ResultsCard>
        </>
      )}

      {openEditar && (
        <RegistrarEmpleados
          mode="edit"
          empleadoId={id}
          empleado={empleado}
          sucursalEmpleado={sucursalEmpleado}
          onClose={() => setOpenEditar(false)}
        />
      )}
    </Container>
  );
}

const Container = styled.div`
  min-height: calc(100dvh - 30px);
  padding: 20px 22px 28px;
  display: grid;
  gap: 16px;
  background: ${({ theme }) => theme.bgtotal};
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  .titleGroup {
    display: grid;
    gap: 6px;
  }

  .headerActions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  h2 {
    font-size: 1.4rem;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }
`;

const StatusPill = styled.span`
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
  background: rgba(31, 166, 94, 0.15);
  color: #1f8f5c;

  &.inactivo {
    background: rgba(220, 53, 69, 0.15);
    color: #c82333;
  }
`;

const InfoCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
`;

const ResultsCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 18px 30px;
  grid-template-columns: repeat(1, minmax(0, 1fr));

  @media ${Device.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media ${Device.tablet} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media ${Device.laptop} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const InfoItem = styled.div`
  display: grid;
  gap: 6px;

  .label {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.textsecundary};
  }

  .value {
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }
`;

const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
  align-items: center;

  @media ${DeviceMax.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 0 12px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    height: 52px;
    min-height: 32px;
    line-height: 1;
    box-sizing: border-box;
    font-size: 0.85rem;
    text-align: center;
  }

  .tab.active {
    border-color: ${({ theme }) => theme.color1};
    color: ${({ theme }) => theme.color1};
    background: rgba(31, 141, 255, 0.08);
  }
`;

const InfoBanner = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  color: ${({ theme }) => theme.text};
  font-size: 0.9rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmptyState = styled.div`
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.textsecundary};
  text-align: center;
`;

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-AR");
}
