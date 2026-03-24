import { supabase } from "./supabase.config.jsx";

const tableFeatures = "funcionalidades";
const tableRoles = "app_roles";
const tablePermissions = "funcionalidades_roles";
const tablePuestos = "puestos_laborales";

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
  const { error } = await supabase.from(tableFeatures).delete().eq("id", featureId);
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

export async function fetchPuestosLaborales() {
  const { data, error } = await supabase
    .from(tablePuestos)
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPermissions({
  roleId = null,
  puestoId = null,
  includeGeneralFallback = false,
} = {}) {
  const normalizedRoleId = toNullableNumber(roleId);
  const normalizedPuestoId = toNullableNumber(puestoId);

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
      role:app_roles(id,name),
      puesto:puestos_laborales(id,name)
    `
    )
    .order("feature_id", { ascending: true })
    .order("app_role_id", { ascending: true });

  if (normalizedRoleId !== null) {
    query = query.eq("app_role_id", normalizedRoleId);
  }

  if (includeGeneralFallback && normalizedPuestoId !== null) {
    query = query.or(`puesto_id.is.null,puesto_id.eq.${normalizedPuestoId}`);
  } else if (normalizedPuestoId === null) {
    query = query.is("puesto_id", null);
  } else {
    query = query.eq("puesto_id", normalizedPuestoId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export function computeEffectivePermission(
  roleId,
  featureId,
  puestoId,
  permissionRows = []
) {
  const normalizedRoleId = toNullableNumber(roleId);
  const normalizedFeatureId = toNullableNumber(featureId);
  const normalizedPuestoId = toNullableNumber(puestoId);

  const matchingRows = (permissionRows ?? []).filter((row) => {
    return (
      Number(row?.app_role_id) === normalizedRoleId &&
      Number(row?.feature_id) === normalizedFeatureId
    );
  });

  const specificRow =
    normalizedPuestoId === null
      ? null
      : matchingRows.find((row) => Number(row?.puesto_id) === normalizedPuestoId) ??
        null;

  const generalRow =
    matchingRows.find(
      (row) => row?.puesto_id === null || row?.puesto_id === undefined
    ) ?? null;

  const selectedRow = specificRow ?? generalRow;
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
    source: specificRow ? "override" : "general",
    inherited: !specificRow && normalizedPuestoId !== null,
    row: selectedRow,
  };
}

async function fetchGeneralPermissionRow(appRoleId, featureId) {
  const { data, error } = await supabase
    .from(tablePermissions)
    .select("id, app_role_id, feature_id, puesto_id")
    .eq("app_role_id", appRoleId)
    .eq("feature_id", featureId)
    .is("puesto_id", null)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
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

  if (payload.puesto_id === null) {
    const existingGeneral = await fetchGeneralPermissionRow(
      payload.app_role_id,
      payload.feature_id,
    );

    if (existingGeneral?.id) {
      const { data, error } = await supabase
        .from(tablePermissions)
        .update(payload)
        .eq("id", existingGeneral.id)
        .select("*");

      if (error) throw error;

      const updatedRow = Array.isArray(data) ? data[0] ?? null : data ?? null;
      if (updatedRow) {
        return updatedRow;
      }

      const refreshedGeneral = await fetchGeneralPermissionRow(
        payload.app_role_id,
        payload.feature_id,
      );

      if (refreshedGeneral?.id) {
        throw new Error(
          "No se pudo actualizar el permiso. Verifica la policy UPDATE de funcionalidades_roles."
        );
      }

      const { data: insertedData, error: insertError } = await supabase
        .from(tablePermissions)
        .insert(payload)
        .select("*")
        .maybeSingle();

      if (insertError) throw insertError;
      return insertedData;
    }
  }

  const { data, error } = await supabase
    .from(tablePermissions)
    .upsert(payload, {
      onConflict: "app_role_id,feature_id,puesto_id",
    })
    .select("*");

  if (error) throw error;

  const upsertedRow = Array.isArray(data) ? data[0] ?? null : data ?? null;
  if (!upsertedRow) {
    throw new Error(
      "No se pudo guardar el permiso. Verifica las policies de funcionalidades_roles."
    );
  }
  return upsertedRow;
}

export async function deletePermissionOverride({
  app_role_id,
  feature_id,
  puesto_id,
}) {
  const appRoleId = Number(app_role_id);
  const featureId = Number(feature_id);
  const puestoId = toNullableNumber(puesto_id);

  if (!appRoleId || !featureId || puestoId === null) {
    throw new Error("app_role_id, feature_id y puesto_id son requeridos");
  }

  const { error } = await supabase
    .from(tablePermissions)
    .delete()
    .eq("app_role_id", appRoleId)
    .eq("feature_id", featureId)
    .eq("puesto_id", puestoId);

  if (error) throw error;
  return true;
}
