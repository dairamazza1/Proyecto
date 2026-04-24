import { supabase } from "./supabase.config.jsx";

const tableFeatures = "funcionalidades";
const tableRoles = "app_roles";
const tablePermissions = "funcionalidades_roles";

const emptyPermission = {
  can_view: false,
  can_create: false,
  can_update: false,
  can_delete: false,
  can_validate: false,
};

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export async function fetchFeatures() {
  const { data, error } = await supabase
    .from(tableFeatures)
    .select("id, name")
    .order("id", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createFeature({ name }) {
  const featureName = String(name ?? "").trim();
  if (!featureName) {
    throw new Error("El nombre de la funcionalidad es requerido");
  }
  const { data, error } = await supabase
    .from(tableFeatures)
    .insert({ name: featureName })
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateFeature(id, { name }) {
  const featureId = Number(id);
  const featureName = String(name ?? "").trim();
  if (!featureId || !featureName) {
    throw new Error("ID y nombre de funcionalidad son requeridos");
  }
  const { data, error } = await supabase
    .from(tableFeatures)
    .update({ name: featureName })
    .eq("id", featureId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteFeature(id) {
  const featureId = Number(id);
  if (!featureId) {
    throw new Error("ID de funcionalidad invalido");
  }
  const { error } = await supabase
    .from(tableFeatures)
    .delete()
    .eq("id", featureId);
  if (error) throw error;
  return true;
}

export async function fetchRoles() {
  const { data, error } = await supabase
    .from(tableRoles)
    .select("id, name")
    .order("id", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPuestos() {
  const { data, error } = await supabase
    .from("puestos_laborales")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPermissions(params = {}) {
  const { roleId = null } = params;
  const normalizedRoleId = toNullableNumber(roleId);
  const hasPuestoIdFilter = Object.prototype.hasOwnProperty.call(
    params,
    "puestoId",
  );
  const normalizedPuestoId = hasPuestoIdFilter
    ? toNullableNumber(params.puestoId)
    : null;

  let query = supabase
    .from(tablePermissions)
    .select(
      `
      id,
      app_role_id,
      feature_id,
      puesto_id,
      can_view,
      can_create,
      can_update,
      can_delete,
      can_validate,
      created_at,
      feature:funcionalidades(id,name),
      role:app_roles(id,name)
    `
    )
    .order("feature_id", { ascending: true })
    .order("app_role_id", { ascending: true })
    .order("puesto_id", { ascending: true, nullsFirst: true });

  if (normalizedRoleId !== null) {
    query = query.eq("app_role_id", normalizedRoleId);
  }

  if (hasPuestoIdFilter) {
    if (normalizedPuestoId !== null) {
      query = query.or(`puesto_id.is.null,puesto_id.eq.${normalizedPuestoId}`);
    } else {
      query = query.is("puesto_id", null);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export function computeEffectivePermission(
  roleId,
  featureId,
  permissionRows = [],
  puestoId = null,
) {
  const normalizedRoleId = toNullableNumber(roleId);
  const normalizedFeatureId = toNullableNumber(featureId);
  const normalizedPuestoId = toNullableNumber(puestoId);

  const specificRow =
    normalizedPuestoId === null
      ? null
      : (permissionRows ?? []).find(
          (row) =>
            Number(row?.app_role_id) === normalizedRoleId &&
            Number(row?.feature_id) === normalizedFeatureId &&
            Number(row?.puesto_id) === normalizedPuestoId,
        ) ?? null;

  if (specificRow) {
    return {
      can_view: Boolean(specificRow.can_view),
      can_create: Boolean(specificRow.can_create),
      can_update: Boolean(specificRow.can_update),
      can_delete: Boolean(specificRow.can_delete),
      can_validate: Boolean(specificRow.can_validate),
      source: "puesto",
      inherited: false,
      row: specificRow,
    };
  }

  const selectedRow =
    (permissionRows ?? []).find(
      (row) =>
        Number(row?.app_role_id) === normalizedRoleId &&
        Number(row?.feature_id) === normalizedFeatureId &&
        (row?.puesto_id === null || row?.puesto_id === undefined)
    ) ?? null;

  if (!selectedRow) {
    return {
      ...emptyPermission,
      source: "none",
      inherited: false,
      row: null,
    };
  }

  return {
    can_view: Boolean(selectedRow.can_view),
    can_create: Boolean(selectedRow.can_create),
    can_update: Boolean(selectedRow.can_update),
    can_delete: Boolean(selectedRow.can_delete),
    can_validate: Boolean(selectedRow.can_validate),
    source: "general",
    inherited: false,
    row: selectedRow,
  };
}

async function fetchPermissionRow({ appRoleId, featureId, puestoId = null }) {
  const normalizedPuestoId = toNullableNumber(puestoId);

  let query = supabase
    .from(tablePermissions)
    .select("id, app_role_id, feature_id, puesto_id")
    .eq("app_role_id", appRoleId)
    .eq("feature_id", featureId)
    .order("id", { ascending: true })
    .limit(1);

  if (normalizedPuestoId === null) {
    query = query.is("puesto_id", null);
  } else {
    query = query.eq("puesto_id", normalizedPuestoId);
  }

  const response = await query.maybeSingle();

  if (response.error) throw response.error;
  return response.data ?? null;
}

export async function upsertPermission(permission) {
  const payload = {
    app_role_id: Number(permission?.app_role_id),
    feature_id: Number(permission?.feature_id),
    puesto_id: toNullableNumber(permission?.puesto_id),
    can_view: Boolean(permission?.can_view),
    can_create: Boolean(permission?.can_create),
    can_update: Boolean(permission?.can_update),
    can_delete: Boolean(permission?.can_delete),
    can_validate: Boolean(permission?.can_validate),
  };

  if (!payload.app_role_id || !payload.feature_id) {
    throw new Error("app_role_id y feature_id son requeridos");
  }

  const existingPermission = await fetchPermissionRow({
    appRoleId: payload.app_role_id,
    featureId: payload.feature_id,
    puestoId: payload.puesto_id,
  });

  if (existingPermission?.id) {
    const { data, error } = await supabase
      .from(tablePermissions)
      .update(payload)
      .eq("id", existingPermission.id)
      .select("*");

    if (error) throw error;

    const updatedRow = Array.isArray(data) ? data[0] ?? null : data ?? null;
    if (updatedRow) {
      return updatedRow;
    }

    const refreshedPermission = await fetchPermissionRow({
      appRoleId: payload.app_role_id,
      featureId: payload.feature_id,
      puestoId: payload.puesto_id,
    });

    if (refreshedPermission?.id) {
      throw new Error(
        "No se pudo actualizar el permiso. Verifica la policy UPDATE de funcionalidades_roles."
      );
    }
  }

  const { data, error } = await supabase
    .from(tablePermissions)
    .insert(payload)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
}
