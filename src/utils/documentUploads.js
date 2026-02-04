const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function validateDocumentFile(file) {
  if (!file) return "Selecciona un archivo.";
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return "Formato invalido. Usa PDF o imagen.";
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return "El archivo supera 5 MB.";
  }
  return "";
}

export { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE, validateDocumentFile };
