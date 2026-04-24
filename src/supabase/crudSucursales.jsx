import { supabase } from "./supabase.config.jsx";

const bucketDocuments = "documents";

const SUPPORTED_BANNER_IMAGE_TYPES = new Set(["png", "jpg", "gif", "bmp"]);

const normalizeEmpleadoStatusFilter = (statusFilter = "active") => {
  const normalized = String(statusFilter ?? "active").trim().toLowerCase();
  return ["all", "active", "inactive"].includes(normalized)
    ? normalized
    : "active";
};

const filterEmpleadosByStatus = (empleados = [], statusFilter = "active") => {
  const normalized = normalizeEmpleadoStatusFilter(statusFilter);
  if (normalized === "active") {
    return empleados.filter((empleado) => empleado?.is_active === true);
  }
  if (normalized === "inactive") {
    return empleados.filter((empleado) => empleado?.is_active === false);
  }
  return empleados;
};

const inferBannerImageType = (filePath = "") => {
  const normalized = String(filePath ?? "").trim().toLowerCase();
  if (normalized.endsWith(".png")) return "png";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "jpg";
  if (normalized.endsWith(".gif")) return "gif";
  if (normalized.endsWith(".bmp")) return "bmp";
  return "";
};

const inferBannerImageTypeFromMime = (contentType = "") => {
  const mime = String(contentType ?? "").split(";")[0].trim().toLowerCase();
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/gif") return "gif";
  if (mime === "image/bmp" || mime === "image/x-ms-bmp") return "bmp";
  return "";
};

const inferBannerImageTypeFromBytes = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer ?? new ArrayBuffer(0));
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpg";
  }

  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "gif";
  }

  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return "bmp";
  }

  return "";
};

const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(String(value).trim());

const normalizeBannerStoragePath = (value = "") => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (isAbsoluteUrl(raw)) {
    try {
      const url = new URL(raw);
      const decodedPath = decodeURIComponent(url.pathname);
      const signMatch = decodedPath.match(/\/object\/sign\/[^/]+\/(.+)$/i);
      if (signMatch?.[1]) return signMatch[1].replace(/^\/+/, "");

      const publicMatch = decodedPath.match(/\/object\/public\/[^/]+\/(.+)$/i);
      if (publicMatch?.[1]) return publicMatch[1].replace(/^\/+/, "");
    } catch {
      return raw;
    }
  }

  return raw
    .replace(/^\/+/, "")
    .replace(/^documents\/+/i, "");
};

const fetchBannerBinary = async ({ url, filePath }) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudo descargar el banner configurado para la sucursal.");
  }

  const data = await response.arrayBuffer();
  const typeFromBytes = inferBannerImageTypeFromBytes(data);
  const typeFromMime = inferBannerImageTypeFromMime(
    response.headers.get("content-type")
  );
  const typeFromPath = inferBannerImageType(filePath || url);
  const type = typeFromBytes || typeFromMime || typeFromPath;

  if (!SUPPORTED_BANNER_IMAGE_TYPES.has(type) || !typeFromBytes) {
    throw new Error(
      "El banner configurado para la sucursal no es una imagen valida. Usa PNG, JPG, GIF o BMP."
    );
  }

  return {
    filePath,
    type,
    data,
  };
};


// Obtener todas las sucursales de una empresa
export async function getSucursales({ empresa_id } = {}) {
  let query = supabase
    
    .from("sucursales")
    .select("id, name, address, zone, province, tel, banner_template")
    .order("name", { ascending: true });

  if (empresa_id) {
    query = query.eq("empresa_id", empresa_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getSucursalById(id) {
  if (!id) return null;

  const { data, error } = await supabase
    .from("sucursales")
    .select("id, name, address, zone, province, tel, banner_template")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function downloadSucursalBannerTemplate(filePath) {
  const rawPath = String(filePath ?? "").trim();
  const normalizedPath = normalizeBannerStoragePath(rawPath);
  if (!normalizedPath) return null;

  if (isAbsoluteUrl(rawPath)) {
    return fetchBannerBinary({
      url: rawPath,
      filePath: normalizedPath,
    });
  }

  const { data, error } = await supabase.storage
    .from(bucketDocuments)
    .createSignedUrl(normalizedPath, 60 * 10);

  if (error || !data?.signedUrl) {
    const { data: publicData } = supabase.storage
      .from(bucketDocuments)
      .getPublicUrl(normalizedPath);

    if (!publicData?.publicUrl) {
      throw error ?? new Error("No se pudo resolver el banner configurado para la sucursal.");
    }

    return fetchBannerBinary({
      url: publicData.publicUrl,
      filePath: normalizedPath,
    });
  }

  return fetchBannerBinary({
    url: data.signedUrl,
    filePath: normalizedPath,
  });
}

// Relacionar empleado con sucursal en la tabla sucursales_empleados
export async function insertSucursalEmpleado(payload) {
  const { data, error } = await supabase
    
    .from("sucursales_empleados")
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSucursalEmpleado(empleado_id) {
  const { data, error } = await supabase
    
    .from("sucursales_empleados")
    .select("id, empleado_id, sucursal_id")
    .eq("empleado_id", empleado_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertSucursalEmpleado({ empleado_id, sucursal_id }) {
  const existing = await getSucursalEmpleado(empleado_id);
  if (existing?.id) {
    const { data, error } = await supabase
      
      .from("sucursales_empleados")
      .update({ sucursal_id })
      .eq("id", existing.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    
    .from("sucursales_empleados")
    .insert({ empleado_id, sucursal_id })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Obtener empleados por sucursal con join
export async function getEmpleadosBySucursal({
  sucursal_id,
  empresa_id,
  orderBy = "last_name",
  ascending = true,
  statusFilter = "active",
} = {}) {
  let query = supabase
    
    .from("sucursales_empleados")
    .select(
      `
      empleado_id,
      empleados:empleado_id (
        id,
        document_number,
        first_name,
        last_name,
        puesto:puestos_laborales(name),
        empresa_id,
        employee_id_number,
        professional_number,
        telephone,
        birthday,
        genre,
        is_active
      )
    `
    );

  if (sucursal_id) {
    query = query.eq("sucursal_id", sucursal_id);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Aplanar los datos para que sean compatibles con la tabla existente
  let empleados = data?.map((item) => item.empleados).filter(Boolean) ?? [];

  // Filtrar por empresa si se proporciona
  if (empresa_id) {
    empleados = empleados.filter((emp) => emp.empresa_id === empresa_id);
  }

  empleados = filterEmpleadosByStatus(empleados, statusFilter);

  // Ordenar los resultados
  empleados.sort((a, b) => {
    const aVal = a[orderBy] ?? "";
    const bVal = b[orderBy] ?? "";
    if (ascending) {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return empleados;
}

// Buscar empleados por sucursal
export async function searchEmpleadosBySucursal({
  sucursal_id,
  empresa_id,
  search = "",
  orderBy = "last_name",
  ascending = true,
  statusFilter = "active",
} = {}) {
  const term = search?.trim();
  let empleados = await getEmpleadosBySucursal({
    sucursal_id,
    empresa_id,
    orderBy,
    ascending,
    statusFilter,
  });

  if (term) {
    empleados = empleados.filter((emp) => {
      const normalizedTerm = term.toLowerCase();
      const matchName =
        emp.first_name?.toLowerCase().includes(normalizedTerm) ||
        emp.last_name?.toLowerCase().includes(normalizedTerm) ||
        emp.puesto?.name?.toLowerCase().includes(normalizedTerm) ||
        emp.professional_number?.toLowerCase().includes(normalizedTerm);

      const matchNumber = /^\d+$/.test(term)
        ? emp.document_number === term || emp.employee_id_number === term
        : false;

      return matchName || matchNumber;
    });
  }

  return empleados;
}
