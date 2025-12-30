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
import { useNavigate } from "react-router-dom";
import { v } from "../../styles/variables";

export function EmpleadoTemplate({ id, empleado, isError, sucursalEmpleado }) {
  const navigate = useNavigate();
  const [openEditar, setOpenEditar] = useState(false);
  const [activeTab, setActiveTab] = useState("vacaciones");
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
            <Btn1
              icono={<v.iconeditarTabla />}
              titulo="Editar"
              bgcolor="#F9D70B"
              funcion={() => setOpenEditar(true)}
            />
          </div>
        )}
      </Header>

      {!id && <EmptyState>Nuevo empleado</EmptyState>}

      {id && isError && (
        <EmptyState>No se pudo cargar la informacion del empleado.</EmptyState>
      )}

      {id && empleado && (
        <>
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

          {activeTab === "vacaciones" && (
            <VacacionesSection empleado={empleado} empleadoId={id} />
          )}
          {activeTab === "licencias" && (
            <LicenciasSection empleadoId={id} />
          )}
          {activeTab === "cambios" && (
            <CambiosSection empleadoId={id} />
          )}
          {activeTab === "sanciones" && (
            <SancionesSection empleadoId={id} />
          )}
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

const InfoGrid = styled.div`
  display: grid;
  gap: 18px 30px;
  grid-template-columns: repeat(1, minmax(0, 1fr));

  @media (min-width: ${v.bplisa}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: ${v.bpbart}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (min-width: ${v.bpmarge}) {
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
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  .tab {
    border-radius: 999px;
    padding: 8px 16px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    font-weight: 600;
    cursor: pointer;
  }

  .tab.active {
    border-color: ${({ theme }) => theme.color1};
    color: ${({ theme }) => theme.color1};
    background: rgba(31, 141, 255, 0.08);
  }
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
