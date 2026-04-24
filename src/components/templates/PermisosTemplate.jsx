import styled from "styled-components";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { Spinner1, Title, usePermissions } from "../../index";
import {
  computeEffectivePermission,
  fetchFeatures,
  fetchPermissions,
  fetchPuestos,
  fetchRoles,
  upsertPermission,
} from "../../supabase/crudPermisos";
import { FEATURES } from "../../utils/features";

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

const sourceLabel = (source) => {
  if (source === "puesto") return "Puesto";
  if (source === "general") return "General";
  return "Sin regla";
};

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const permissionRowMatcher = (rows, roleId, featureId, puestoId = null) => {
  const normalizedPuestoId = toNullableNumber(puestoId);

  return (
  (rows ?? []).find(
    (row) =>
      Number(row?.app_role_id) === Number(roleId) &&
      Number(row?.feature_id) === Number(featureId) &&
      toNullableNumber(row?.puesto_id) === normalizedPuestoId
  ) ?? null
  );
};

export function PermisosTemplate() {
  const queryClient = useQueryClient();
  const { canUpdate } = usePermissions();
  const canEditPermissions = canUpdate(FEATURES.PERMISOS);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPuestoId, setSelectedPuestoId] = useState("");

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
    queryFn: fetchPuestos,
    refetchOnWindowFocus: false,
  });

  const permissionsQuery = useQuery({
    queryKey: ["permissionsGridGeneral"],
    queryFn: () => fetchPermissions(),
    refetchOnWindowFocus: false,
  });

  const features = useMemo(() => {
    const featuresByName = new Map(
      (featuresQuery.data ?? []).map((feature) => [feature?.name, feature])
    );

    return FEATURE_CATALOG.map((featureName) =>
      featuresByName.get(featureName)
    ).filter(Boolean);
  }, [featuresQuery.data]);

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const puestos = useMemo(() => puestosQuery.data ?? [], [puestosQuery.data]);
  const permissionsRows = useMemo(
    () => permissionsQuery.data ?? [],
    [permissionsQuery.data]
  );
  const resolvedSelectedRoleId = selectedRoleId || String(roles[0]?.id ?? "");
  const selectedRoleNumeric = toNullableNumber(resolvedSelectedRoleId);
  const selectedPuestoNumeric = toNullableNumber(selectedPuestoId);
  const selectedRole = useMemo(
    () =>
      roles.find((role) => Number(role?.id) === Number(selectedRoleNumeric)) ?? null,
    [roles, selectedRoleNumeric]
  );
  const selectedPuesto = useMemo(
    () =>
      puestos.find(
        (puesto) => Number(puesto?.id) === Number(selectedPuestoNumeric)
      ) ?? null,
    [puestos, selectedPuestoNumeric]
  );

  const refreshPermissionsQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["permissions"] }),
      queryClient.invalidateQueries({ queryKey: ["permissionsGridGeneral"] }),
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

  const getCellState = (roleId, featureId) => {
    return getPermissionCellState(roleId, featureId, null);
  };

  const handlePermissionToggle = ({
    roleId,
    featureId,
    puestoId = null,
    actionKey,
    checked,
  }) => {
    const { effective, exactRow, generalRow } = getPermissionCellState(
      roleId,
      featureId,
      puestoId
    );
    const base =
      exactRow ??
      (puestoId !== null ? effective : generalRow) ??
      basePermission;

    upsertPermissionMutation.mutate({
      app_role_id: roleId,
      feature_id: featureId,
      puesto_id: puestoId,
      can_view: Boolean(base.can_view),
      can_create: Boolean(base.can_create),
      can_update: Boolean(base.can_update),
      can_delete: Boolean(base.can_delete),
      can_validate: Boolean(base.can_validate),
      [actionKey]: Boolean(checked),
    });
  };

  const isLoading =
    featuresQuery.isLoading ||
    rolesQuery.isLoading ||
    puestosQuery.isLoading ||
    permissionsQuery.isLoading;

  const firstError =
    featuresQuery.error ||
    rolesQuery.error ||
    puestosQuery.error ||
    permissionsQuery.error;

  function getPermissionCellState(roleId, featureId, puestoId = null) {
    const normalizedPuestoId = toNullableNumber(puestoId);
    const effective = computeEffectivePermission(
      roleId,
      featureId,
      permissionsRows,
      normalizedPuestoId
    );
    const exactRow = permissionRowMatcher(
      permissionsRows,
      roleId,
      featureId,
      normalizedPuestoId
    );
    const generalRow = permissionRowMatcher(
      permissionsRows,
      roleId,
      featureId,
      null
    );
    return { effective, exactRow, generalRow };
  }

  if (isLoading) return <Spinner1 />;
  if (firstError) {
    return <span>ha ocurrido un error: {firstError.message}</span>;
  }

  return (
    <Container>
      <Header>
        <div className="titleGroup">
          <Title>Permisos</Title>
          <p>Configura permisos globales por rol y overrides puntuales por puesto.</p>
        </div>
      </Header>

      <TableCard>
        <div className="sectionHeader">
          <div>
            <h3>Matriz de permisos globales</h3>
            <p>Controla acceso a modulos y acciones por rol.</p>
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
                    const { effective } = getCellState(role.id, feature.id);
                    const disabled =
                      upsertPermissionMutation.isPending ||
                      !canEditPermissions;

                    return (
                      <td key={`${feature.id}-${role.id}`}>
                        <div className="permissionCell">
                          <div className="cellHeader">
                            <span className={`source ${effective.source}`}>
                              {sourceLabel(effective.source)}
                            </span>
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

      <TableCard>
        <div className="sectionHeader">
          <div>
            <h3>Permisos por puesto</h3>
            <p>Selecciona un rol y un puesto para editar overrides especificos.</p>
          </div>
        </div>

        <div className="filtersRow">
          <label className="selectField">
            <span>Rol</span>
            <select
              value={resolvedSelectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>

          <label className="selectField">
            <span>Puesto</span>
            <select
              value={selectedPuestoId}
              onChange={(event) => setSelectedPuestoId(event.target.value)}
            >
              <option value="">Selecciona un puesto</option>
              {puestos.map((puesto) => (
                <option key={puesto.id} value={puesto.id}>
                  {puesto.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedRoleNumeric && selectedPuestoNumeric ? (
          <div className="tableWrap">
            <table className="permissionsTable puestoTable">
              <thead>
                <tr>
                  <th>Funcionalidad</th>
                  <th>
                    {selectedRole?.name ?? "Rol"} / {selectedPuesto?.name ?? "Puesto"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => {
                  const { effective } = getPermissionCellState(
                    selectedRoleNumeric,
                    feature.id,
                    selectedPuestoNumeric
                  );
                  const disabled =
                    upsertPermissionMutation.isPending || !canEditPermissions;

                  return (
                    <tr key={`puesto-${feature.id}`}>
                      <td>
                        <div className="featureNameCell">
                          <span>{feature.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="permissionCell">
                          <div className="cellHeader">
                            <span className={`source ${effective.source}`}>
                              {sourceLabel(effective.source)}
                            </span>
                          </div>

                          <div className="toggleList">
                            {permissionActions.map((action) => (
                              <label
                                key={`puesto-${feature.id}-${action.key}`}
                                className="toggleItem"
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(effective[action.key])}
                                  disabled={disabled}
                                  onChange={(event) =>
                                    handlePermissionToggle({
                                      roleId: selectedRoleNumeric,
                                      featureId: feature.id,
                                      puestoId: selectedPuestoNumeric,
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>
            Selecciona un rol y un puesto para configurar permisos especificos.
          </EmptyState>
        )}
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

  .filtersRow {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 14px;
  }

  .selectField {
    display: grid;
    gap: 6px;
  }

  .selectField span {
    font-size: 0.82rem;
    font-weight: 700;
    color: ${({ theme }) => theme.textsecundary};
  }

  .selectField select {
    width: 100%;
    min-height: 44px;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    padding: 0 12px;
    outline: none;
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

  .source.general {
    color: ${({ theme }) => theme.color1};
    border-color: ${({ theme }) => theme.color1};
  }

  .source.puesto {
    color: var(--color-success);
    border-color: var(--color-success);
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

  @media (max-width: 760px) {
    .filtersRow {
      grid-template-columns: 1fr;
    }
  }
`;

const EmptyState = styled.div`
  padding: 18px;
  border-radius: 14px;
  border: 1px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.textsecundary};
  text-align: center;
`;
