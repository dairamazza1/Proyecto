export const EMERGENCY_VINCULO_OPTIONS = [
  "Madre",
  "Padre",
  "Hijo/a",
  "Hermano/a",
  "Abuelo/a",
  "Nieto/a",
  "Tío/a",
  "Sobrino/a",
  "Primo/a",
  "Cónyuge",
  "Esposo/a",
  "Pareja",
  "Suegro/a",
  "Yerno",
  "Nuera",
  "Cuñado/a",
  "Tutor/a",
  "Otro",
];

export const EMERGENCY_DOC_TYPE_OPTIONS = ["DNI", "Otro"];

export function createEmptyEmergencyContact(variant = "empleado") {
  if (variant === "paciente") {
    return {
      id: undefined,
      name: "",
      telephone: "",
      vinculo: "",
      relative: "",
      doc_type: "DNI",
      doc_number: "",
    };
  }

  return {
    id: undefined,
    name: "",
    telephone: "",
    vinculo: "",
    relative: "",
  };
}
