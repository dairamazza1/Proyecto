import styled from "styled-components";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { Spinner1, Title, usePermissions } from "../../index";
import {
  computeEffectivePermission,
  deletePermissionOverride,
  fetchClinicalAreas,
  fetchFeatures,
  fetchPermissions,
  fetchPuestosLaborales,
  fetchRoles,
  upsertPermission,
  updateClinicalAreaPermission,
} from "../../supabase/crudPermisos";
import { FEATURES } from "../../utils/features";
import { DeviceMax } from "../../styles/breakpoints";

const permissionActions = [
  { key: "can_view", label: "Ver" },
  { key: "can_create", label: "Crear" },
  { key: "can_update", label: "Editar" },
  { key: "can_delete", label: "Borrar" },
  { key: "can_validate", label: "Aprobaciones" },
];

const basePermission = {
  can_view: false,
  can_create: false,
  can_update: false,
  can_delete: false,
  can_validate: false,
};
const FEATURE_CATALOG = Object.values(FEATURES);

const normalizePuestoId = (value) => {
  if (value === "general" || value === "" || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const sourceLabel = (selectedPuestoId, source) => {
  if (selectedPuestoId === null) return "General";
  if (source === "override") return "Override";
  if (source === "general") return "Heredado";
  return "Sin regla";
};

const permissionRowMatcher = (rows, roleId, featureId, puestoId) =>
  (rows ?? []).find(
    (row) =>
      Number(row?.app_role_id) === Number(roleId) &&
      Number(row?.feature_id) === Number(featureId) &&
      (puestoId === null
        ? row?.puesto_id === null || row?.puesto_id === undefined
        : Number(row?.puesto_id) === Number(puestoId))
  ) ?? null;

export function PermisosTemplate() {
  const queryClient = useQueryClient();
  const { canUpdate } = usePermissions();
  const [scopeValue, setScopeValue] = useState("general");

  const selectedPuestoId = normalizePuestoId(scopeValue);
  const canUpdatePermisos = canUpdate(FEATURES.PERMISOS);
  const canEditPermissions = canUpdatePermisos;

  const featuresQuery = useQuery({
    queryKey: ["permissionsFeatures"],
    queryFn: fetchFeatures,
    refetchOnWindowFocus: false,
  });

  const rolesQuery = useQuery({
    queryKey: ["permissionsRoles"],
    queryFn: fetchRoles,
    refetchOnWindowFocus: false,
  });

  const puestosQuery = useQuery({
    queryKey: ["permissionsPuestos"],
    queryFn: fetchPuestosLaborales,
    refetchOnWindowFocus: false,
  });

  const clinicalAreasQuery = useQuery({
    queryKey: ["clinicalAreasPermissions"],
    queryFn: fetchClinicalAreas,
    refetchOnWindowFocus: false,
  });

  const generalPermissionsQuery = useQuery({
    queryKey: ["permissionsGridGeneral"],
    queryFn: () => fetchPermissions({ puestoId: null }),
    refetchOnWindowFocus: false,
  });

  const overridePermissionsQuery = useQuery({
    queryKey: ["permissionsGridOverrides", selectedPuestoId],
    queryFn: () => fetchPermissions({ puestoId: selectedPuestoId }),
    enabled: selectedPuestoId !== null,
    refetchOnWindowFocus: false,
  });

  const features = useMemo(() => {
    const featuresByName = new Map(
      (featuresQuery.data ?? []).map((feature) => [feature?.name, feature]),
    );

    return FEATURE_CATALOG.map((featureName) => featuresByName.get(featureName)).filter(Boolean);
  }, [featuresQuery.data]);
  const roles = rolesQuery.data ?? [];
  const puestos = puestosQuery.data ?? [];
  const clinicalAreas = clinicalAreasQuery.data ?? [];
  const generalPermissions = useMemo(
    () => generalPermissionsQuery.data ?? [],
    [generalPermissionsQuery.data]
  );
  const overridePermissions = useMemo(
    () => overridePermissionsQuery.data ?? [],
    [overridePermissionsQuery.data]
  );

  const permissionsRows = useMemo(() => {
    if (selectedPuestoId === null) return generalPermissions;
    return [...generalPermissions, ...overridePermissions];
  }, [generalPermissions, overridePermissions, selectedPuestoId]);

  const refreshPermissionsQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["permissions"] }),
      queryClient.invalidateQueries({ queryKey: ["permissionsGridGeneral"] }),
      queryClient.invalidateQueries({ queryKey: ["permissionsGridOverrides"] }),
    ]);
  };

  const upsertPermissionMutation = useMutation({
    mutationFn: (payload) => upsertPermission(payload),
    onSuccess: refreshPermissionsQueries,
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo guardar el permiso",
        text: error?.message ?? "Intenta nuevamente.",
      });
    },
  });

  const updateClinicalAreaMutation = useMutation({
    mutationFn: ({ id, enabled }) => updateClinicalAreaPermission(id, enabled),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["clinicalAreasPermissions"] }),
        queryClient.invalidateQueries({ queryKey: ["pacienteEquipoProfesionalesSearch"] }),
        queryClient.invalidateQueries({ queryKey: ["pacienteEquipoTratante"] }),
      ]);
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo actualizar la elegibilidad clínica",
        text: error?.message ?? "Intenta nuevamente.",
      });
    },
  });

  const resetOverrideMutation = useMutation({
    mutationFn: (payload) => deletePermissionOverride(payload),
    onSuccess: refreshPermissionsQueries,
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo resetear el override",
        text: error?.message ?? "Intenta nuevamente.",
      });
    },
  });

  const getCellState = (roleId, featureId) => {
    const effective = computeEffectivePermission(
      roleId,
      featureId,
      selectedPuestoId,
      permissionsRows
    );
    const generalRow = permissionRowMatcher(
      generalPermissions,
      roleId,
      featureId,
      null
    );
    const overrideRow =
      selectedPuestoId === null
        ? null
        : permissionRowMatcher(
            overridePermissions,
            roleId,
            featureId,
            selectedPuestoId
          );
    return { effective, generalRow, overrideRow };
  };

  const handlePermissionToggle = ({
    roleId,
    featureId,
    actionKey,
    checked,
  }) => {
    const { generalRow, overrideRow } = getCellState(roleId, featureId);

    const base =
      selectedPuestoId === null
        ? generalRow ?? basePermission
        : overrideRow ?? generalRow ?? basePermission;

    upsertPermissionMutation.mutate({
      app_role_id: roleId,
      feature_id: featureId,
      puesto_id: selectedPuestoId,
      can_view: Boolean(base.can_view),
      can_create: Boolean(base.can_create),
      can_update: Boolean(base.can_update),
      can_delete: Boolean(base.can_delete),
      can_validate: Boolean(base.can_validate),
      [actionKey]: Boolean(checked),
    });
  };

  const handleResetOverride = ({ roleId, featureId }) => {
    if (selectedPuestoId === null) return;
    resetOverrideMutation.mutate({
      app_role_id: roleId,
      feature_id: featureId,
      puesto_id: selectedPuestoId,
    });
  };

  const handleClinicalAreaToggle = (area) => {
    if (!area?.id || !canEditPermissions || updateClinicalAreaMutation.isPending) return;
    updateClinicalAreaMutation.mutate({
      id: area.id,
      enabled: !area?.grants_patient_clinical_permissions,
    });
  };

  const isLoading =
    featuresQuery.isLoading ||
    rolesQuery.isLoading ||
    puestosQuery.isLoading ||
    clinicalAreasQuery.isLoading ||
    generalPermissionsQuery.isLoading ||
    (selectedPuestoId !== null && overridePermissionsQuery.isLoading);

  const firstError =
    featuresQuery.error ||
    rolesQuery.error ||
    puestosQuery.error ||
    clinicalAreasQuery.error ||
    generalPermissionsQuery.error ||
    overridePermissionsQuery.error;

  if (isLoading) return <Spinner1 />;
  if (firstError) {
    return <span>ha ocurrido un error: {firstError.message}</span>;
  }

  return (
    <Container>
      <Header>
        <div className="titleGroup">
          <Title>Permisos</Title>
          <p>Configura permisos globales y elegibilidad clinica sin mezclar ambos criterios.</p>
        </div>
      </Header>

      <InfoCallout>
        <strong>Permisos globales y elegibilidad clinica</strong>
        <p>
          La matriz define acceso global por rol o puesto a las funcionalidades del sistema.
        </p>
        <p>
          La elegibilidad clinica se configura por area y solo habilita acciones sobre pacientes
          cuando ademas existe una asignacion activa al equipo tratante del ingreso.
        </p>
      </InfoCallout>

      <ControlsCard>
        <div className="scopeControl">
          <label htmlFor="scopeSelect">Alcance de permisos globales</label>
          <select
            id="scopeSelect"
            value={scopeValue}
            onChange={(event) => setScopeValue(event.target.value)}
          >
            <option value="general">General por rol</option>
            {puestos.map((puesto) => (
              <option key={puesto.id} value={puesto.id}>
                Override por puesto: {puesto.name}
              </option>
            ))}
          </select>
        </div>
        <div className="scopeHint">
          <strong>Catálogo fijo</strong>
          <span>
            Esta matriz usa las funcionalidades definidas por el sistema. Ya no se crean
            funcionalidades libres desde esta pantalla.
          </span>
        </div>
      </ControlsCard>

      <ClinicalAreasCard>
        <div className="sectionHeader">
          <div>
            <h3>Elegibilidad clinica por area</h3>
            <p>
              Define que areas otorgan permisos clinicos cuando el profesional queda asignado a
              una internacion.
            </p>
          </div>
        </div>

        {clinicalAreas.length ? (
          <div className="areasGrid">
            {clinicalAreas.map((area) => {
              const enabled = Boolean(area?.grants_patient_clinical_permissions);
              const isDisabled = !canEditPermissions || updateClinicalAreaMutation.isPending;

              return (
                <article key={area.id} className="areaCard">
                  <div className="areaBody">
                    <strong>{area?.name || "Area"}</strong>
                    <span className={`status ${enabled ? "enabled" : "disabled"}`}>
                      {enabled ? "Otorga permisos clinicos" : "No otorga permisos clinicos"}
                    </span>
                  </div>

                  <label className={`toggleRow ${isDisabled ? "isDisabled" : ""}`}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={isDisabled}
                      onChange={() => handleClinicalAreaToggle(area)}
                    />
                    <span>Otorga permisos clinicos</span>
                  </label>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyBlock>No hay áreas laborales disponibles para configurar.</EmptyBlock>
        )}
      </ClinicalAreasCard>

      <TableCard>
        <div className="sectionHeader">
          <div>
            <h3>Matriz de permisos globales</h3>
            <p>
              Controla acceso a módulos y acciones por rol, con overrides opcionales por puesto.
            </p>
          </div>
        </div>
        <div className="tableWrap">
          <table className="permissionsTable">
            <thead>
              <tr>
                <th>Funcionalidad</th>
                {roles.map((role) => (
                  <th key={role.id}>{role.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.id}>
                  <td>
                    <div className="featureNameCell">
                      <span>{feature.name}</span>
                    </div>
                  </td>

                  {roles.map((role) => {
                    const { effective, overrideRow } = getCellState(role.id, feature.id);
                    const disabled =
                      upsertPermissionMutation.isPending ||
                      resetOverrideMutation.isPending ||
                      !canEditPermissions;

                    return (
                      <td key={`${feature.id}-${role.id}`}>
                        <div className="permissionCell">
                          <div className="cellHeader">
                            <span className={`source ${effective.source}`}>
                              {sourceLabel(selectedPuestoId, effective.source)}
                            </span>
                            {selectedPuestoId !== null &&
                              overrideRow &&
                              canUpdatePermisos && (
                                <button
                                  type="button"
                                  className="linkButton"
                                  onClick={() =>
                                    handleResetOverride({
                                      roleId: role.id,
                                      featureId: feature.id,
                                    })
                                  }
                                >
                                  Reset a general
                                </button>
                              )}
                          </div>

                          <div className="toggleList">
                            {permissionActions.map((action) => (
                              <label key={action.key} className="toggleItem">
                                <input
                                  type="checkbox"
                                  checked={Boolean(effective[action.key])}
                                  disabled={disabled}
                                  onChange={(event) =>
                                    handlePermissionToggle({
                                      roleId: role.id,
                                      featureId: feature.id,
                                      actionKey: action.key,
                                      checked: event.target.checked,
                                    })
                                  }
                                />
                                <span>{action.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>
    </Container>
  );
}

const Container = styled.div`
  min-height: calc(100dvh - 30px);
  padding: 24px;
  display: grid;
  gap: 16px;
  align-content: start;
`;

const Header = styled.header`
  .titleGroup {
    display: grid;
    gap: 10px;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.textsecundary};
    font-weight: 500;
  }
`;

const InfoCallout = styled.section`
  background: ${({ theme }) => theme.bg};
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 16px;
  padding: 14px 16px;
  display: grid;
  gap: 6px;
  box-shadow: var(--shadow-elev-1);

  strong,
  p {
    margin: 0;
  }

  strong {
    color: ${({ theme }) => theme.text};
  }

  p {
    color: ${({ theme }) => theme.textsecundary};
    line-height: 1.45;
  }
`;

const ControlsCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 16px;
  box-shadow: var(--shadow-elev-1);
  padding: 16px;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  .scopeControl,
  .scopeHint {
    display: grid;
    gap: 8px;
  }

  label {
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }

  select,
  input {
    height: 44px;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    padding: 0 12px;
    outline: none;
    width: 100%;
  }

  .scopeHint {
    align-content: center;
    border: 1px dashed ${({ theme }) => theme.color2};
    border-radius: 12px;
    padding: 12px;
    background: ${({ theme }) => theme.bgtotal};
  }

  .scopeHint strong,
  .scopeHint span {
    margin: 0;
  }

  .scopeHint span {
    color: ${({ theme }) => theme.textsecundary};
    line-height: 1.45;
  }

  @media ${DeviceMax.tablet} {
    grid-template-columns: 1fr;
  }
`;

const ClinicalAreasCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 16px;
  box-shadow: var(--shadow-elev-1);
  padding: 16px;
  display: grid;
  gap: 14px;

  .sectionHeader h3,
  .sectionHeader p {
    margin: 0;
  }

  .sectionHeader {
    display: grid;
    gap: 6px;
  }

  .sectionHeader p {
    color: ${({ theme }) => theme.textsecundary};
    line-height: 1.45;
  }

  .areasGrid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }

  .areaCard {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    padding: 14px;
    background: ${({ theme }) => theme.bgtotal};
    display: grid;
    gap: 12px;
  }

  .areaBody {
    display: grid;
    gap: 6px;
  }

  .status {
    width: fit-content;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.76rem;
    font-weight: 700;
  }

  .status.enabled {
    background: rgba(52, 125, 96, 0.14);
    color: #2d7a60;
  }

  .status.disabled {
    background: rgba(168, 138, 75, 0.14);
    color: #8b6b2d;
  }

  .toggleRow {
    display: flex;
    align-items: center;
    gap: 10px;
    color: ${({ theme }) => theme.text};
    font-weight: 600;
  }

  .toggleRow.isDisabled {
    opacity: 0.65;
  }

  .toggleRow input {
    width: 16px;
    height: 16px;
    margin: 0;
  }
`;

const TableCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 16px;
  box-shadow: var(--shadow-elev-1);
  padding: 14px;

  .sectionHeader {
    display: grid;
    gap: 6px;
    margin-bottom: 14px;
  }

  .sectionHeader h3,
  .sectionHeader p {
    margin: 0;
  }

  .sectionHeader p {
    color: ${({ theme }) => theme.textsecundary};
    line-height: 1.45;
  }

  .tableWrap {
    width: 100%;
    overflow-x: auto;
  }

  .permissionsTable {
    width: 100%;
    border-spacing: 0;
    min-width: 980px;
  }

  th {
    text-align: center;
    padding: 12px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    color: ${({ theme }) => theme.text};
    font-weight: 700;
    vertical-align: top;
  }

  td {
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    padding: 10px;
    vertical-align: top;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  .featureNameCell {
    display: grid;
    min-width: 180px;
  }

  .featureNameCell span {
    font-weight: 700;
  }

  .permissionCell {
    display: grid;
    gap: 8px;
    min-width: 170px;
  }

  .cellHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .source {
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 4px 8px;
    border: 1px solid ${({ theme }) => theme.color2};
    color: ${({ theme }) => theme.textsecundary};
  }

  .source.override {
    color: var(--color-success);
    border-color: var(--color-success);
  }

  .source.general {
    color: ${({ theme }) => theme.color1};
    border-color: ${({ theme }) => theme.color1};
  }

  .source.none {
    color: var(--color-warning);
    border-color: var(--color-warning);
  }

  .toggleList {
    display: grid;
    gap: 4px;
  }

  .toggleItem {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    color: ${({ theme }) => theme.text};
  }

  .toggleItem input {
    width: 14px;
    height: 14px;
  }

  .linkButton {
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.color1};
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    font-size: 0.78rem;
    padding: 0;
  }
`;

const EmptyBlock = styled.div`
  border: 1px dashed ${({ theme }) => theme.color2};
  border-radius: 14px;
  padding: 16px;
  color: ${({ theme }) => theme.textsecundary};
  background: ${({ theme }) => theme.bgtotal};
`;
