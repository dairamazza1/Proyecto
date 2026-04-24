import { supabase } from "./supabase.config.jsx";

const table = "financiadores";

const normalizeFinanciador = (row) => ({
  ...row,
  code: String(row?.code ?? row?.name ?? "").trim(),
  name: String(row?.name ?? row?.code ?? "").trim(),
});

export async function fetchFinanciadores({ activeOnly = true } = {}) {
  let query = supabase
    .from(table)
    .select("id, code, name, is_active")
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(normalizeFinanciador);
}

export async function fetchCurrentUserAuditorFinanciadorId() {
  const { data, error } = await supabase.rpc(
    "current_user_auditor_financiador_id"
  );
  if (error) throw error;
  return data ?? null;
}
