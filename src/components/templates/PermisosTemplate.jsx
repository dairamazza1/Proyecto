import styled from "styled-components";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { Btn1, Spinner1, Title, usePermissions, v } from "../../index";
import {
  computeEffectivePermission,
  createFeature,
  deleteFeature,
  deletePermissionOverride,
  fetchFeatures,
  fetchPermissions,
  fetchPuestosLaborales,
  fetchRoles,
  upsertPermission,
  updateFeature,
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
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [scopeValue, setScopeValue] = useState("general");
  const [newFeatureName, setNewFeatureName] = useState("");

  const selectedPuestoId = normalizePuestoId(scopeValue);
  const canCreatePermisos = canCreate(FEATURES.PERMISOS);
  const canUpdatePermisos = canUpdate(FEATURES.PERMISOS);
  const canDeletePermisos = canDelete(FEATURES.PERMISOS);
  const canEditPermissions = canCreatePermisos || canUpdatePermisos;

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

  const features = featuresQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const puestos = puestosQuery.data ?? [];
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

  const createFeatureMutation = useMutation({
    mutationFn: ({ name }) => createFeature({ name }),
    onSuccess: async () => {
      setNewFeatureName("");
      await queryClient.invalidateQueries({ queryKey: ["permissionsFeatures"] });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo crear la funcionalidad",
        text: error?.message ?? "Intenta nuevamente.",
      });
    },
  });

  const updateFeatureMutation = useMutation({
    mutationFn: ({ id, name }) => updateFeature(id, { name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["permissionsFeatures"] });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo actualizar la funcionalidad",
        text: error?.message ?? "Intenta nuevamente.",
      });
    },
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: (id) => deleteFeature(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["permissionsFeatures"] }),
        refreshPermissionsQueries(),
      ]);
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar la funcionalidad",
        text: error?.message ?? "Intenta nuevamente.",
      });
    },
  });

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

  const handleCreateFeature = (event) => {
    event.preventDefault();
    const trimmedName = String(newFeatureName ?? "").trim();
    if (!trimmedName) return;
    createFeatureMutation.mutate({ name: trimmedName });
  };

  const handleEditFeature = async (feature) => {
    if (!feature?.id) return;
    const result = await Swal.fire({
      title: "Editar funcionalidad",
      input: "text",
      inputValue: feature.name ?? "",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) =>
        String(value ?? "").trim() ? null : "Ingresa un nombre",
    });
    if (!result.isConfirmed) return;
    updateFeatureMutation.mutate({ id: feature.id, name: result.value });
  };

  const handleDeleteFeature = async (feature) => {
    if (!feature?.id) return;
    const result = await Swal.fire({
      icon: "warning",
      title: "Eliminar funcionalidad",
      text: `Se eliminara "${feature.name}" y sus permisos asociados.`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;
    deleteFeatureMutation.mutate(feature.id);
  };

  const isLoading =
    featuresQuery.isLoading ||
    rolesQuery.isLoading ||
    puestosQuery.isLoading ||
    generalPermissionsQuery.isLoading ||
    (selectedPuestoId !== null && overridePermissionsQuery.isLoading);

  const firstError =
    featuresQuery.error ||
    rolesQuery.error ||
    puestosQuery.error ||
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
          <p>Actualiza los permisos de las funcionalidades</p>
        </div>
      </Header>

      <ControlsCard>
        <div className="scopeControl">
          <label htmlFor="scopeSelect">Asignacion</label>
          <select
            id="scopeSelect"
            value={scopeValue}
            onChange={(event) => setScopeValue(event.target.value)}
          >
            <option value="general">General (por rol)</option>
            {puestos.map((puesto) => (
              <option key={puesto.id} value={puesto.id}>
                Puesto: {puesto.name}
              </option>
            ))}
          </select>
        </div>

        {canCreatePermisos && (
          <form className="featureForm" onSubmit={handleCreateFeature}>
            <label htmlFor="newFeature">Nueva funcionalidad</label>
            <div className="row">
              <input
                id="newFeature"
                type="text"
                value={newFeatureName}
                onChange={(event) => setNewFeatureName(event.target.value)}
                placeholder="Ej: historia_clinica"
              />
              <Btn1
                tipo="submit"
                titulo={createFeatureMutation.isPending ? "Guardando..." : "Agregar"}
                bgcolor={v.colorPrincipal}
                icono={<v.iconoagregar />}
                disabled={createFeatureMutation.isPending}
              />
            </div>
          </form>
        )}
      </ControlsCard>

      <TableCard>
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
                      {(canUpdatePermisos || canDeletePermisos) && (
                        <div className="featureActions">
                          {canUpdatePermisos && (
                            <button
                              type="button"
                              onClick={() => handleEditFeature(feature)}
                            >
                              Editar
                            </button>
                          )}
                          {canDeletePermisos && (
                            <button
                              type="button"
                              className="danger"
                              onClick={() => handleDeleteFeature(feature)}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      )}
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
                              canDeletePermisos && (
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

const ControlsCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 16px;
  box-shadow: var(--shadow-elev-1);
  padding: 16px;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  .scopeControl,
  .featureForm {
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

  .row {
    display: flex;
    gap: 8px;
    align-items: center;

    > :first-child {
      flex: 1;
    }
  }

  @media ${DeviceMax.tablet} {
    grid-template-columns: 1fr;
  }
`;

const TableCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 16px;
  box-shadow: var(--shadow-elev-1);
  padding: 14px;

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
    gap: 8px;
    min-width: 180px;
  }

  .featureNameCell span {
    font-weight: 700;
  }

  .featureActions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .featureActions button {
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    border-radius: 999px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 0.78rem;
  }

  .featureActions button.danger {
    border-color: var(--color-danger);
    color: var(--color-danger);
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
