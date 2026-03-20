import { supabase } from "./supabase.config.jsx";
import { EMERGENCY_VINCULO_OPTIONS } from "../utils/contactosEmergencia";

const TABLE_EMPLEADOS = "empleados_contacto_emergencia";
const TABLE_PACIENTES = "pacientes_contacto_emergencia";
const HOLDER_KEY_EMPLEADOS = "id_empleado";
const HOLDER_KEY_PACIENTES = "id_paciente";
const VALID_VINCULOS = new Set(EMERGENCY_VINCULO_OPTIONS);
const VALID_PACIENTE_DOC_TYPES = new Set(["DNI", "Otro"]);

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const toNullableString = (value) => {
  const normalized = safeString(value);
  return normalized ? normalized : null;
};

const toIsoDateTime = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return null;
  return parsed.toISOString();
};



const isWithinIngresoRange = (contactDate, ingreso) => {
  const createdAt = new Date(contactDate);
  const admissionAt = new Date(ingreso?.admission_at);
  if (Number.isNaN(createdAt.valueOf()) || Number.isNaN(admissionAt.valueOf())) {
    return false;
  }

  const dischargeAt = ingreso?.discharge_at ? new Date(ingreso.discharge_at) : null;
  if (dischargeAt && Number.isNaN(dischargeAt.valueOf())) return false;

  return createdAt >= admissionAt && (!dischargeAt || createdAt <= dischargeAt);
};

function isMeaningfulContact(contact, variant) {
  const hasDoc =
    variant === "paciente" && safeString(contact?.doc_number).length > 0;
  return Boolean(
    safeString(contact?.name) ||
      safeString(contact?.telephone) ||
      safeString(contact?.vinculo) ||
      safeString(contact?.relative) ||
      hasDoc
  );
}

function validatePopulatedContact(contact, variant, rowIndex) {
  const rowLabel = `Contacto ${rowIndex + 1}`;
  if (!safeString(contact?.name)) {
    throw new Error(`${rowLabel}: el nombre es obligatorio.`);
  }
  if (!safeString(contact?.telephone)) {
    throw new Error(`${rowLabel}: el telefono es obligatorio.`);
  }
  const vinculo = safeString(contact?.vinculo);
  if (!vinculo) {
    throw new Error(`${rowLabel}: el vinculo es obligatorio.`);
  }
  if (!VALID_VINCULOS.has(vinculo)) {
    throw new Error(`${rowLabel}: vinculo invalido.`);
  }

  if (variant === "paciente") {
    const docType = safeString(contact?.doc_type);
    if (docType && !VALID_PACIENTE_DOC_TYPES.has(docType)) {
      throw new Error(`${rowLabel}: tipo de documento invalido.`);
    }
    const docNumber = safeString(contact?.doc_number);
    if (docNumber && !/^\d+$/.test(docNumber)) {
      throw new Error(
        `${rowLabel}: el numero de documento debe contener solo numeros.`
      );
    }
  }
}

function normalizeEmpleadoEmergencyContact(contact, rowIndex) {
  if (!isMeaningfulContact(contact, "empleado")) return null;
  validatePopulatedContact(contact, "empleado", rowIndex);

  const vinculoRaw = safeString(contact?.vinculo);
  return {
    id: contact?.id ? Number(contact.id) : undefined,
    name: safeString(contact?.name),
    telephone: safeString(contact?.telephone),
    vinculo: vinculoRaw,
    // Ya no se usa "Parentesco": se guarda el mismo valor que "vinculo".
    relative: toNullableString(vinculoRaw),
  };
}

function normalizePacienteEmergencyContact(contact, rowIndex) {
  if (!isMeaningfulContact(contact, "paciente")) return null;
  validatePopulatedContact(contact, "paciente", rowIndex);

  const docTypeRaw = safeString(contact?.doc_type);
  const docNumberRaw = safeString(contact?.doc_number);
  const vinculoRaw = safeString(contact?.vinculo);
  return {
    id: contact?.id ? Number(contact.id) : undefined,
    name: safeString(contact?.name),
    telephone: safeString(contact?.telephone),
    vinculo: vinculoRaw,
    // En pacientes no se usa "Parentesco": se guarda el mismo valor que "vinculo".
    relative: toNullableString(vinculoRaw),
    doc_type: docNumberRaw ? docTypeRaw || "DNI" : null,
    doc_number: docNumberRaw ? Number(docNumberRaw) : null,
  };
}

function splitContactsForSync({ incomingContacts, existingRows }) {
  const existingIds = new Set((existingRows ?? []).map((row) => Number(row.id)));
  const incomingIds = new Set(
    incomingContacts
      .map((row) => (row?.id ? Number(row.id) : null))
      .filter((id) => Number.isFinite(id))
  );

  const idsToDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));
  const toUpdate = incomingContacts.filter((row) => Number.isFinite(Number(row?.id)));
  const toInsert = incomingContacts.filter((row) => !Number.isFinite(Number(row?.id)));

  return { idsToDelete, toUpdate, toInsert };
}

async function getContactRowsByHolder({ table, holderId, isPaciente = false }) {
  if (!holderId) return [];

  let selectFields = `id, created_at, ${HOLDER_KEY_EMPLEADOS}, name, telephone, vinculo, relative`;
  if (table === TABLE_PACIENTES) {
    selectFields = `id, created_at, ${HOLDER_KEY_PACIENTES}, name, telephone, vinculo, relative`;
  }

  if (isPaciente) {
    selectFields += ", doc_type, doc_number";
  }

  const { data, error } = await supabase
    .from(table)
    .select(selectFields)
    .eq(table === TABLE_PACIENTES ? HOLDER_KEY_PACIENTES : HOLDER_KEY_EMPLEADOS, holderId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw mapContactosEmergenciaError(error);
  return data ?? [];
}

async function syncContactRows({
  table,
  holderId,
  contacts,
  variant,
  includeDocFields = false,
  scopedRows = null,
  createdAtOverride = null,
}) {
  if (!holderId) {
    throw new Error("No se encontro el titular para guardar contactos de emergencia.");
  }

  const normalizedContacts = (contacts ?? [])
    .map((contact, index) =>
      variant === "paciente"
        ? normalizePacienteEmergencyContact(contact, index)
        : normalizeEmpleadoEmergencyContact(contact, index)
    )
    .filter(Boolean);

  const existingRows =
    scopedRows ??
    (await getContactRowsByHolder({
      table,
      holderId,
      isPaciente: includeDocFields,
    }));

  const { idsToDelete, toUpdate, toInsert } = splitContactsForSync({
    incomingContacts: normalizedContacts,
    existingRows,
  });

  if (idsToDelete.length) {
    const { error } = await supabase.from(table).delete().in("id", idsToDelete);
    if (error) throw mapContactosEmergenciaError(error);
  }

  for (const row of toUpdate) {
    const payload = {
      [table === TABLE_PACIENTES ? HOLDER_KEY_PACIENTES : HOLDER_KEY_EMPLEADOS]:
        holderId,
      name: row.name,
      telephone: row.telephone,
      vinculo: row.vinculo,
      relative: row.relative,
      ...(createdAtOverride ? { created_at: createdAtOverride } : {}),
      ...(includeDocFields
        ? {
            doc_type: row.doc_type ?? null,
            doc_number: row.doc_number ?? null,
          }
        : {}),
    };

    const { error } = await supabase.from(table).update(payload).eq("id", row.id);
    if (error) throw mapContactosEmergenciaError(error);
  }

  if (toInsert.length) {
    const payload = toInsert.map((row) => ({
      [table === TABLE_PACIENTES ? HOLDER_KEY_PACIENTES : HOLDER_KEY_EMPLEADOS]:
        holderId,
      name: row.name,
      telephone: row.telephone,
      vinculo: row.vinculo,
      relative: row.relative,
      ...(createdAtOverride ? { created_at: createdAtOverride } : {}),
      ...(includeDocFields
        ? {
            doc_type: row.doc_type ?? null,
            doc_number: row.doc_number ?? null,
          }
        : {}),
    }));

    const { error } = await supabase.from(table).insert(payload);
    if (error) throw mapContactosEmergenciaError(error);
  }

  return getContactRowsByHolder({
    table,
    holderId,
    isPaciente: includeDocFields,
  });
}

export async function getEmpleadoContactosEmergenciaByEmpleadoId(empleadoId) {
  return getContactRowsByHolder({ table: TABLE_EMPLEADOS, holderId: empleadoId });
}

export async function syncEmpleadoContactosEmergencia({ empleadoId, contacts }) {
  return syncContactRows({
    table: TABLE_EMPLEADOS,
    holderId: empleadoId,
    contacts,
    variant: "empleado",
    includeDocFields: false,
  });
}

export async function getPacienteContactosEmergenciaByPacienteId(pacienteId) {
  return getContactRowsByHolder({
    table: TABLE_PACIENTES,
    holderId: pacienteId,
    isPaciente: true,
  });
}

export function resolvePacienteContactosEmergenciaByIngreso(
  contactos = [],
  ingreso = null
) {
  if (!ingreso?.admission_at) return [];

  return (contactos ?? []).filter((row) =>
    isWithinIngresoRange(row?.created_at, ingreso)
  );
}

export async function syncPacienteContactosEmergencia({ pacienteId, contacts }) {
  return syncContactRows({
    table: TABLE_PACIENTES,
    holderId: pacienteId,
    contacts,
    variant: "paciente",
    includeDocFields: true,
  });
}

export async function syncPacienteContactosEmergenciaByIngreso({
  pacienteId,
  contacts,
  effectiveDate,
  scopeIngreso,
}) {
  if (!scopeIngreso?.admission_at && !effectiveDate) {
    throw new Error(
      "No se encontro la internacion para guardar contactos de emergencia."
    );
  }

  const allRows = await getPacienteContactosEmergenciaByPacienteId(pacienteId);
  const scopedRows = resolvePacienteContactosEmergenciaByIngreso(allRows, {
    admission_at: scopeIngreso?.admission_at ?? effectiveDate,
    discharge_at: scopeIngreso?.discharge_at ?? null,
  });

  return syncContactRows({
    table: TABLE_PACIENTES,
    holderId: pacienteId,
    contacts,
    variant: "paciente",
    includeDocFields: true,
    scopedRows,
    createdAtOverride:
      toIsoDateTime(effectiveDate ?? scopeIngreso?.admission_at) ?? undefined,
  });
}
