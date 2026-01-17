import styled from "styled-components";
import { useEffect, useState } from "react";
import {
  CambiosSection,
  LicenciasSection,
  SancionesSection,
  Title,
  VacacionesSection,
} from "../../index";
import { usePermissions } from "../../hooks/usePermissions";
import { Device, DeviceMax } from "../../styles/breakpoints";

export function PerfilTemplate({ perfil, empleado, displayName, userEmail }) {
  const { userRole } = usePermissions();
  const [activeTab, setActiveTab] = useState("vacaciones");

  const canSeeSanciones = userRole !== "employee";

  useEffect(() => {
    if (!canSeeSanciones && activeTab === "sanciones") {
      setActiveTab("vacaciones");
    }
  }, [canSeeSanciones, activeTab]);

  const email = perfil?.email || userEmail || "";
  const emailLabel = email || "-";

  // const profileId = perfil?.id || "-";

  const fullName = [empleado?.first_name, empleado?.last_name]
    .filter(Boolean)
    .join(" ");
  const legajo =
    empleado?.employee_id_number ??
    empleado?.document_number ??
    empleado?.id ??
    "-";
  const documentInfo = empleado?.document_number
    ? `${empleado?.document_type ?? "Doc"} ${empleado?.document_number}`
    : "-";
  const hireDate = formatDate(empleado?.hire_date);
  const terminationDate = formatDate(empleado?.termination_date);
  const statusLabel = empleado?.is_active ? "Activo" : "Inactivo";

  return (
    <Container>
      <Header>
        <div className="titleGroup">
          <Title>Mi Perfil</Title>
          <h2>{displayName}</h2>
        </div>
        {/* {empleado && (
          <div className="headerActions">
            <StatusPill className={empleado?.is_active ? "activo" : "inactivo"}>
              Estado: {statusLabel}
            </StatusPill>
          </div>
        )} */}
      </Header>

      {!empleado && userRole == "rrhh" && (
        <EmptyState>
          Tu perfil de recursos humanos aun no esta asociado a un empleado.
        </EmptyState>
      )}

      {!empleado && userRole == "admin" && (
        <EmptyState>
          Perfil de administrador
        </EmptyState>
      )}

      {!empleado && userRole == "employee" && (
        <EmptyState>
          Tu perfil aun no esta asociado a un empleado. Contacta a recursos humanos.
        </EmptyState>
      )}

      {empleado && (
        <>
          {userRole === "employee" && (
            <InfoBanner>Contacta a RRHH para modificaciones.</InfoBanner>
          )}

          <InfoCard>
            <InfoGrid $cols={4}>
              <InfoItem>
                <span className="label">Nro de Legajo</span>
                <span className="value">{legajo}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">Email</span>
                <span className="value">{emailLabel}</span>
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
                <span className="label">Nro de telefono</span>
                <span className="value">{empleado?.telephone ?? "-"}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">Puesto</span>
                <span className="value">{empleado?.puesto ?? "-"}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">Matricula profesional</span>
                <span className="value">
                  {empleado?.professional_number ?? "-"}
                </span>
              </InfoItem>
              {/* <InfoItem>
                <span className="label">Empleado Registrado</span>
                <span className="value">
                  {empleado?.is_registered ? "Si" : "No"}
                </span>
              </InfoItem> */}
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
              {!fullName && (
                <InfoItem>
                  <span className="label">Empleado</span>
                  <span className="value">{`Empleado ${
                    empleado?.id ?? "-"
                  }`}</span>
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
            {canSeeSanciones && (
              <button
                className={`tab ${activeTab === "sanciones" ? "active" : ""}`}
                type="button"
                onClick={() => setActiveTab("sanciones")}
              >
                Sanciones
              </button>
            )}
          </Tabs>

          <ResultsCard>
            {activeTab === "vacaciones" && (
              <VacacionesSection
                empleado={empleado}
                empleadoId={empleado.id}
                embedded
                title="Mis vacaciones"
              />
            )}
            {activeTab === "licencias" && (
              <LicenciasSection
                empleadoId={empleado.id}
                embedded
                title="Mis licencias"
              />
            )}
            {activeTab === "cambios" && (
              <CambiosSection
                empleadoId={empleado.id}
                embedded
                title="Mis cambios de turnos"
              />
            )}
            {activeTab === "sanciones" && canSeeSanciones && (
              <SancionesSection empleadoId={empleado.id} embedded />
            )}
          </ResultsCard>
        </>
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
    font-size: 1.2rem;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }
`;

const StatusPill = styled.span`
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
  background: var(--bg-success-soft);
  color: var(--color-success);

  &.inactivo {
    background: var(--bg-danger-soft);
    color: var(--color-danger);
  }
`;

const InfoCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: var(--shadow-elev-1);
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 16px 24px;
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
    word-break: break-word;
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
    background: var(--bg-accent-soft);
  }
`;

const ResultsCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: var(--shadow-elev-1);
`;

const InfoBanner = styled.div`
  background: var(--bg-warning-soft);
  border: 1px solid var(--border-warning-soft);
  border-radius: 8px;
  padding: 12px 16px;
  color: ${({ theme }) => theme.text};
  font-size: 0.9rem;
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
