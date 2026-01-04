import styled from "styled-components";
import { CambiosSection, LicenciasSection, Title, VacacionesSection } from "../../index";

export function PerfilTemplate({ perfil, empleado, displayName, userEmail }) {
  const email = perfil?.email || userEmail || "-";
  const role =
    perfil?.role ||
    perfil?.app_role ||
    perfil?.rol ||
    perfil?.id_role ||
    "-";

  const profileId = perfil?.id || "-";

  return (
    <Container>
      <Header>
        <div className="titleGroup">
          <Title>Mi Perfil</Title>
          <h2>{displayName}</h2>
        </div>
      </Header>

      <InfoCard>
        <InfoGrid>
          <InfoItem>
            <span className="label">Email</span>
            <span className="value">{email}</span>
          </InfoItem>
          <InfoItem>
            <span className="label">Rol</span>
            <span className="value">{role}</span>
          </InfoItem>
          <InfoItem>
            <span className="label">ID Perfil</span>
            <span className="value">{profileId}</span>
          </InfoItem>
        </InfoGrid>
      </InfoCard>

      {!empleado && (
        <EmptyState>
          Tu perfil aun no esta asociado a un empleado. Contacta administracion.
        </EmptyState>
      )}

      {empleado && (
        <>
          <VacacionesSection
            empleado={empleado}
            empleadoId={empleado.id}
            title="Mis vacaciones"
          />
          <LicenciasSection empleadoId={empleado.id} title="Mis licencias" />
          <CambiosSection empleadoId={empleado.id} title="Mis cambios de turnos" />
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

  h2 {
    font-size: 1.2rem;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
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
  gap: 16px 24px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

const EmptyState = styled.div`
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.textsecundary};
  text-align: center;
`;
