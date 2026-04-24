import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import {
  Btn1,
  ModalEmpleadoBajaForm,
  ModalInvitarUsuario,
  RegistrarEmpleados,
  Title,
  UserAuth,
  VacacionesSection,
  LicenciasSection,
  CambiosSection,
  FaltasSection,
  SancionesSection,
  useCompanyStore,
} from "../../index";
import { usePermissions } from "../../hooks/usePermissions";
import { v } from "../../styles/variables";
import { Device, DeviceMax } from "../../styles/breakpoints";
import { useSearchParams } from "react-router-dom";

export function EmpleadoTemplate({ id, empleado, isError, sucursalEmpleado }) {
  const [openEditar, setOpenEditar] = useState(false);
  const [openBaja, setOpenBaja] = useState(false);
  const [openInvitar, setOpenInvitar] = useState(false);
  const [activeTab, setActiveTab] = useState("vacaciones");
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Hook de permisos
  const { canUpdate, canRead, canCreate, isEmployee } = usePermissions();
  const canEditEmpleados = useMemo(() => canUpdate("empleados"), [canUpdate]);
  const canInvite = useMemo(() => canCreate("empleados"), [canCreate]);
  const canSeeCambios = useMemo(
    () => canRead("cambios_turno"),
    [canRead]
  );
  const canSeeSanciones = useMemo(
    () => canRead("sanciones"),
    [canRead]
  );

  useEffect(() => {
    const allowedTabs = new Set(["vacaciones", "licencias", "faltas"]);
    if (canSeeCambios) {
      allowedTabs.add("cambios");
    }
    if (canSeeSanciones) {
      allowedTabs.add("sanciones");
    }
    const nextTab = tabParam ? String(tabParam).toLowerCase() : "vacaciones";
    setActiveTab(allowedTabs.has(nextTab) ? nextTab : "vacaciones");
  }, [tabParam, canSeeCambios, canSeeSanciones]);

  const { user } = UserAuth();
  const { dataCompany, showCompany } = useCompanyStore();

  useQuery({
    queryKey: ["empresa", user?.id],
    queryFn: () => showCompany({ id_auth: user?.id }),
    enabled: Boolean(user?.id) && !dataCompany?.id,
    refetchOnWindowFocus: false,
  });

  const empresaId = dataCompany?.id ?? null;

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
  const statusLabel = empleado?.is_active ? "Activo" : "Inactivo";
  const emailLabel = empleado?.perfil?.email ?? "-";
  const ageLabel = formatAge(empleado?.birthday);
  const genreLabel = empleado?.genre ?? "-";
  const shiftLabel = formatShift(empleado?.shift);
  const auditorFinanciadorLabel =
    empleado?.auditor_financiador?.name ??
    empleado?.auditor_financiador?.code ??
    "-";

  const terminationDate = formatDate(empleado?.termination_date);

  const hasUser = Boolean(empleado?.user_id);
  const canRenderBaja = Boolean(canEditEmpleados && empleado?.is_active);
  const headerActionCount = [canInvite, canEditEmpleados, canRenderBaja].filter(Boolean).length;

  const empleadoInviteLabel = useMemo(() => {
    const name =
      fullName || (empleado ? `Empleado ${empleado.id}` : "Empleado");
    const legajoLabel = legajo ? ` - ${legajo}` : "";
    return `${name}${legajoLabel}`;
  }, [empleado, fullName, legajo]);

  return (
    <Container>
      <Header>
        <div className="titleGroup">
          <Title>Empleado</Title>
          <div className="profileHeading">
            <h2>{fullName ? `Perfil Profesional de ${fullName}` : "-"}</h2>
            {id && empleado && (
              <StatusPill className={empleado?.is_active ? "activo" : "inactivo"}>
                Estado: {statusLabel}
              </StatusPill>
            )}
          </div>
        </div>
        {id && empleado && (
          <div
            className="headerActions"
            style={{
              "--header-actions-columns": String(
                Math.max(1, Math.min(3, headerActionCount))
              ),
            }}
          >
            {canInvite && (
              <Btn1
                icono={<v.iconoagregar />}
                titulo={hasUser ? "Usuario creado" : "Crear usuario"}
                bgcolor={v.colorPrincipal}
                funcion={() => setOpenInvitar(true)}
                disabled={hasUser || !empresaId}
                tipo="button"
              />
            )}
            
            {canEditEmpleados && (
              <Btn1
                icono={<v.iconeditarTabla />}
                titulo="Editar"
                bgcolor={v.colorPrincipal}
                funcion={() => setOpenEditar(true)}
              />
            )}
            {canRenderBaja && (
              <Btn1
                icono={<v.iconocerrar />}
                titulo="Dar de baja"
                bgcolor="var(--color-danger)"
                funcion={() => setOpenBaja(true)}
                tipo="button"
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
              ?? Estas en modo solo lectura. Contacta a RRHH para modificaciones.
            </InfoBanner>
          )}

          <InfoCard>
            <InfoGrid>
              <InfoItem>
                <span className="label">Nro de Legajo</span>
                <span className="value">{legajo}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">Email</span>
                <span className="value">{emailLabel}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">Fecha ingreso</span>
                <span className="value">{hireDate}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">Empleado Registrado</span>
                <span className="value">
                  {empleado?.is_registered ? "Si" : "No"}
                </span>
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
                <span className="label">Edad</span>
                <span className="value">{ageLabel}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">Genero</span>
                <span className="value">{genreLabel}</span>
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
                <span className="value">{empleado?.puesto?.name ?? "-"}</span>
              </InfoItem>
              {empleado?.auditor_financiador_id && (
                <InfoItem>
                  <span className="label">Financiador auditor</span>
                  <span className="value">{auditorFinanciadorLabel}</span>
                </InfoItem>
              )}
              <InfoItem>
                <span className="label">Turno</span>
                <span className="value">{shiftLabel}</span>
              </InfoItem>
              <InfoItem>
                <span className="label">Matricula profesional</span>
                <span className="value">
                  {empleado?.professional_number ?? "-"}
                </span>
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
              className={`tab ${activeTab === "faltas" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("faltas")}
            >
              Faltas
            </button>
             <button
              className={`tab ${activeTab === "licencias" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("licencias")}
            >
              Licencias (extendidas)
            </button>
            {canSeeCambios && (
              <button
                className={`tab ${activeTab === "cambios" ? "active" : ""}`}
                type="button"
                onClick={() => setActiveTab("cambios")}
              >
                Cambios de turnos (legajo)
              </button>
            )}
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
              <VacacionesSection empleado={empleado} empleadoId={id} embedded />
            )}
            {activeTab === "licencias" && (
              <LicenciasSection empleadoId={id} embedded />
            )}
            {activeTab === "faltas" && (
              <FaltasSection empleadoId={id} embedded />
            )}
            {activeTab === "cambios" && canSeeCambios && (
              <CambiosSection empleadoId={id} embedded />
            )}
            {activeTab === "sanciones" && canSeeSanciones && (
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

      {openBaja && id && empleado && (
        <ModalEmpleadoBajaForm
          empleadoId={id}
          empleadoLabel={fullName || `Empleado ${id}`}
          onClose={() => setOpenBaja(false)}
        />
      )}

      {openInvitar && id && empleado && (
        <ModalInvitarUsuario
          empresaId={empresaId}
          empleadoId={id}
          empleadoLabel={empleadoInviteLabel}
          onClose={() => setOpenInvitar(false)}
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  .titleGroup {
    display: grid;
    gap: 6px;
    flex: 1 1 320px;
    min-width: 0;
  }

  .profileHeading {
    display: flex;
    align-items: center;
    gap: 10px 12px;
    flex-wrap: wrap;
    min-width: 0;
  }

  .headerActions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
    flex: 0 1 auto;
  }

  .headerActions > * {
    flex: 0 0 auto;
  }

  .headerActions > button {
    padding: 10px 18px;
    min-height: 48px;
  }

  .headerActions > button .content {
    align-items: center;
    gap: 10px;
  }

  .headerActions > button .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1.15;
    text-align: center;
  }

  h2 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
    min-width: 0;
    overflow-wrap: anywhere;
  }

  @media ${DeviceMax.mobile} {
    .titleGroup,
    .headerActions {
      width: 100%;
    }

    .headerActions {
      display: grid;
      grid-template-columns: repeat(
        var(--header-actions-columns, 1),
        minmax(0, 1fr)
      );
      justify-content: stretch;
      gap: 10px;
    }

    .headerActions > * {
      min-width: 0;
    }

    .headerActions > button {
      width: 100%;
      padding: 10px 12px;
      min-height: 52px;
      font-size: 0.9rem;
    }

    .headerActions > button .content {
      width: 100%;
      justify-content: center;
      gap: 8px;
    }

    .headerActions > button .btn {
      min-width: 0;
      overflow-wrap: anywhere;
    }
  }
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 1.1;
  white-space: nowrap;
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

const ResultsCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: var(--shadow-elev-1);
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
    word-break: break-word;
    overflow-wrap: anywhere;
    white-space: normal;
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

const InfoBanner = styled.div`
  background: var(--bg-warning-soft);
  border: 1px solid var(--border-warning-soft);
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

function formatAge(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  if (age < 0) return '-';
  return `${age} años`;
}

function formatShift(value) {
  if (!value) return '-';
  const raw = String(value).trim().toLowerCase();
  if (raw === 'manana') return 'Mañana';
  if (raw === 'tarde') return 'Tarde';
  if (raw === 'noche') return 'Noche';
  if (raw === 'rotativo') return 'Rotativo';
  return value;
}





