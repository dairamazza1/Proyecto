import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  Btn1,
  ConvertirCapitalize,
  EmergencyContactsSection,
  Icd10TreeSelect,
  InputText,
  PacienteAntecedentesSection,
  Spinner1,
} from "../../../index";
import {
  createPacienteConIngreso,
  createReingresoPaciente,
  getPacienteCoberturasByPacienteId,
  resolvePacienteCoberturaByDate,
  searchPacientes,
  syncPacienteEquipoTratanteByIngreso,
  syncPacienteCoberturaByDate,
  updatePacienteIngreso,
  updatePacienteIngresoAdminissionType,
  updatePaciente,
} from "../../../supabase/crudPacientes";
import {
  getPacienteAntecedentesByPacienteId,
  syncPacienteAntecedentes,
} from "../../../supabase/crudPacientesAntecedentes";
import {
  getPacienteContactosEmergenciaByPacienteId,
  resolvePacienteContactosEmergenciaByIngreso,
  syncPacienteContactosEmergenciaByIngreso,
} from "../../../supabase/crudContactosEmergencia";
import { createEmptyEmergencyContact } from "../../../utils/contactosEmergencia";
import {
  createDefaultPacienteAntecedentesFormValues,
  mapPacienteAntecedentesToFormValues,
} from "../../../utils/pacienteAntecedentes";
import {
  normalizePacienteConditionType,
  PACIENTE_CONDITION_OPTIONS,
} from "../../../utils/pacienteCondition";
import { Device, DeviceMax } from "../../../styles/breakpoints";
import { v } from "../../../styles/variables";
import { PacienteEquipoTratanteSection } from "./PacienteEquipoTratanteSection";

const OTHER_DIAGNOSIS_CODE = "OTHER";
const ADMINISSION_TYPE_OPTIONS = ["Voluntario", "Involuntario"];
const COVERAGE_OPTIONS = [
  "AMEPBA",
  "IOMA",
  "LIBSALUD",
  "Otro",
  "PAMI",
  "PSIQUE",
  "TIKUM",
  "VITAS",
];

const defaultEmergencyContact = () => createEmptyEmergencyContact("paciente");
const getCurrentDateTimeInput = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};
const createDefaultCoverageValues = () => ({
  coverage_option: "",
  coverage_custom: "",
  coverage_notes: "",
});

const createDefaultValues = ({ admissionAt } = {}) => ({
  ...createDefaultCoverageValues(),
  ...createDefaultPacienteAntecedentesFormValues(),
  first_name: "",
  last_name: "",
  document_type: "DNI",
  document_number: "",
  birthday: "",
  genre: "",
  telephone: "",
  email: "",
  address: "",
  localidad: "",
  condition_type: normalizePacienteConditionType("agudo") || "agudo",
  estado_civil: "",
  convivencia: "",
  educacion: "",
  alfabetizado: "",
  ocupacion: "",
  religion: "",
  lugar_nacimiento: "",
  hijos: "",
  emergency_contacts: [defaultEmergencyContact()],
  admission_at: admissionAt || getCurrentDateTimeInput(),
  adminission_type: "",
  admission_reason_notes: "",
});

const EMPTY_ARRAY = [];

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value);

const normalizeAdminissionType = (value) => {
  const normalized = safeString(value).trim().toLowerCase();
  if (normalized === "voluntario") return "Voluntario";
  if (normalized === "involuntario") return "Involuntario";
  return "";
};

const toDateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

const toDateTimeLocalInput = (value) => {
  if (!value) return "";
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
  ) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(
    parsed.getDate(),
  )}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
};

const toIsoDateTime = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return null;
  return parsed.toISOString();
};

const formatPatientSearchLabel = (patient) => {
  const fullName = [patient?.first_name, patient?.last_name]
    .filter(Boolean)
    .join(" ");
  const doc = [patient?.document_type, patient?.document_number]
    .filter(Boolean)
    .join(" ");
  return [fullName, doc ? `(${doc})` : ""].filter(Boolean).join(" ");
};

const mapPatientToFormValues = (patient) => ({
  first_name: safeString(patient?.first_name),
  last_name: safeString(patient?.last_name),
  document_type: safeString(patient?.document_type) || "DNI",
  document_number: safeString(patient?.document_number),
  birthday: toDateInput(patient?.birthday),
  genre: safeString(patient?.genre),
  telephone: safeString(patient?.telephone),
  email: safeString(patient?.email),
  address: safeString(patient?.address),
  localidad: safeString(patient?.localidad),
  condition_type:
    normalizePacienteConditionType(patient?.condition_type) || "agudo",
  estado_civil: safeString(patient?.estado_civil),
  convivencia: safeString(patient?.convivencia),
  educacion: safeString(patient?.educacion),
  alfabetizado:
    typeof patient?.alfabetizado === "boolean"
      ? String(patient.alfabetizado)
      : "",
  ocupacion: safeString(patient?.ocupacion),
  religion: safeString(patient?.religion),
  lugar_nacimiento: safeString(patient?.lugar_nacimiento),
  hijos:
    patient?.hijos === null || patient?.hijos === undefined
      ? ""
      : String(patient.hijos),
});

const mapCoverageToFormValues = (coverage) => ({
  coverage_option: COVERAGE_OPTIONS.includes(safeString(coverage?.coverage).trim())
    ? safeString(coverage?.coverage).trim()
    : safeString(coverage?.coverage).trim()
      ? "Otro"
      : "",
  coverage_custom:
    COVERAGE_OPTIONS.includes(safeString(coverage?.coverage).trim()) ||
    !safeString(coverage?.coverage).trim()
      ? ""
      : safeString(coverage?.coverage).trim(),
  coverage_notes: safeString(coverage?.coverage_notes),
});

const resolveCoverageValueFromForm = (values) => {
  const option = safeString(values?.coverage_option).trim();
  if (!option) return "";
  if (option === "Otro") return safeString(values?.coverage_custom).trim();
  return option;
};

const pickPreservedValues = (values) => ({
  admission_at:
    toDateTimeLocalInput(values?.admission_at) || getCurrentDateTimeInput(),
  adminission_type: normalizeAdminissionType(values?.adminission_type),
  admission_reason_notes: safeString(values?.admission_reason_notes),
  emergency_contacts: [defaultEmergencyContact()],
});
const normalizePersonName = (value) => {
  const trimmed = safeString(value).trim();
  return trimmed ? ConvertirCapitalize(trimmed) : "";
};

const normalizeNullableNumber = (value) => {
  const normalized = safeString(value).trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeDateOnly = (value) => {
  const normalized = safeString(value).trim();
  if (!normalized) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

const buildComparablePacientePayload = ({ paciente, empresaId }) => ({
  empresa_id: empresaId ?? paciente?.empresa_id ?? null,
  first_name: normalizePersonName(paciente?.first_name),
  last_name: normalizePersonName(paciente?.last_name),
  document_type: safeString(paciente?.document_type).trim() || null,
  document_number: safeString(paciente?.document_number).trim() || null,
  birthday: normalizeDateOnly(paciente?.birthday),
  genre: safeString(paciente?.genre).trim() || null,
  telephone: safeString(paciente?.telephone).trim() || null,
  email: safeString(paciente?.email).trim() || null,
  address: safeString(paciente?.address).trim() || null,
  localidad: safeString(paciente?.localidad).trim() || null,
  condition_type:
    normalizePacienteConditionType(paciente?.condition_type) || "agudo",
  estado_civil: safeString(paciente?.estado_civil).trim() || null,
  convivencia: safeString(paciente?.convivencia).trim() || null,
  educacion: safeString(paciente?.educacion).trim() || null,
  alfabetizado:
    paciente?.alfabetizado === "" || paciente?.alfabetizado === undefined
      ? null
      : paciente?.alfabetizado === true || paciente?.alfabetizado === "true",
  ocupacion: safeString(paciente?.ocupacion).trim() || null,
  religion: safeString(paciente?.religion).trim() || null,
  lugar_nacimiento: safeString(paciente?.lugar_nacimiento).trim() || null,
  hijos: normalizeNullableNumber(paciente?.hijos),
});

const arePacientePayloadsEqual = (left, right) =>
  JSON.stringify(left) === JSON.stringify(right);

const buildPacientePayload = ({ data, empresaId }) => {
  const n = (value) => {
    const trimmed = safeString(value).trim();
    return trimmed ? trimmed : null;
  };
  return {
    empresa_id: empresaId,
    first_name: normalizePersonName(data.first_name),
    last_name: normalizePersonName(data.last_name),
    document_type: n(data.document_type),
    document_number: n(data.document_number),
    birthday: data.birthday || null,
    genre: n(data.genre),
    telephone: n(data.telephone),
    email: n(data.email),
    address: n(data.address),
    localidad: n(data.localidad),
    condition_type: normalizePacienteConditionType(data.condition_type) || "agudo",
    estado_civil: n(data.estado_civil),
    convivencia: n(data.convivencia),
    educacion: n(data.educacion),
    alfabetizado:
      data.alfabetizado === "" || data.alfabetizado === undefined
        ? null
        : data.alfabetizado === "true",
    ocupacion: n(data.ocupacion),
    religion: n(data.religion),
    lugar_nacimiento: n(data.lugar_nacimiento),
    hijos: normalizeNullableNumber(data.hijos),
  };
};

const getDiagnosisDisplay = (selectedDiagnosis, otherDiagnosis) => {
  if (!selectedDiagnosis) return "";
  if (selectedDiagnosis.code === OTHER_DIAGNOSIS_CODE)
    return safeString(otherDiagnosis).trim();
  return [
    safeString(selectedDiagnosis.code).trim(),
    safeString(selectedDiagnosis.description).trim(),
  ]
    .filter(Boolean)
    .join(" - ");
};

const buildAdmissionReasonValue = ({ diagnosisLabel, additionalNotes }) => {
  const normalizedNotes = safeString(additionalNotes).trim();
  return normalizedNotes || "";
};

const getAdmissionReasonNotes = ({ admissionReason }) => {
  const rawReason = safeString(admissionReason).trim();
  if (!rawReason) return "";

  const lines = rawReason
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const notesLine = lines.find((line) =>
    /^(motivos de internacion):/i.test(line),
  );

  if (notesLine) {
    return notesLine.replace(/^(motivos de internacion):\s*/i, "").trim();
  }
  if (lines.some((line) => line.toLowerCase().startsWith("diagnostico:"))) {
    return "";
  }
  return rawReason;
};

const getDiagnosisStateFromStoredValue = (diagnosis) => {
  const raw = safeString(diagnosis).trim();
  if (!raw) {
    return { selectedDiagnosis: null, otherDiagnosis: "" };
  }

  const separator = " - ";
  if (raw.includes(separator)) {
    const [code, ...descriptionParts] = raw.split(separator);
    const description = descriptionParts.join(separator).trim();
    if (code.trim() && description) {
      return {
        selectedDiagnosis: {
          code: code.trim(),
          description,
          node_type: "leaf",
        },
        otherDiagnosis: "",
      };
    }
  }

  return {
    selectedDiagnosis: {
      code: OTHER_DIAGNOSIS_CODE,
      description: "Otro",
      node_type: "other",
    },
    otherDiagnosis: raw,
  };
};

const getPacienteSaveErrorMessage = (
  error,
  fallbackMessage = "No se pudo guardar el ingreso.",
) => {
  const message = safeString(error?.message);
  const constraint = safeString(error?.details || error?.hint || error?.code);
  const raw = `${message} ${constraint}`.toLowerCase();

  if (
    raw.includes("pacientes_doc_unique") ||
    raw.includes("duplicate key value") ||
    raw.includes("23505")
  ) {
    return "Ya existe un paciente con ese tipo y numero de documento.";
  }

  if (raw.includes("pacientes_contacto_emergencia_id_fkey")) {
    return "No se pudieron guardar los contactos de emergencia porque la tabla de contactos tiene una clave foranea invalida. Hay que corregir esa constraint en la base para permitir reingresos con contactos nuevos.";
  }

  return message || fallbackMessage;
};

function AccordionPanel({ title, isOpen, onToggle, subtitle, children }) {
  return (
    <section className="accordionPanel">
      <button type="button" className="accordionHeader" onClick={onToggle}>
        <div className="headerTexts">
          <span className="title">{title}</span>
          {subtitle ? <small>{subtitle}</small> : null}
        </div>
        <span className={`accordionAction ${isOpen ? "expanded" : ""}`}>
          <span className="actionLabel">
            {isOpen ? "Ver menos" : "Ver mas"}
          </span>
          <span className="chevron">
            <v.iconoFlechabajo />
          </span>
        </span>
      </button>
      {isOpen ? <div className="accordionBody">{children}</div> : null}
    </section>
  );
}

export function ModalPacienteIngresoForm({
  empresaId,
  sucursalId = null,
  onClose,
  pacientePreselected = null,
  mode = "admission",
  editReferenceDate = null,
  ingresoPreselected = null,
}) {
  const queryClient = useQueryClient();
  const isEditMode = mode === "editPatient";
  const referenceAdmissionAt =
    toDateTimeLocalInput(ingresoPreselected?.admission_at) ||
    toDateTimeLocalInput(editReferenceDate) ||
    getCurrentDateTimeInput();

  const [selectedPatient, setSelectedPatient] = useState(
    pacientePreselected ?? null,
  );
  const [searchTerm, setSearchTerm] = useState(
    pacientePreselected ? formatPatientSearchLabel(pacientePreselected) : "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [otherDiagnosis, setOtherDiagnosis] = useState("");
  const [diagnosisError, setDiagnosisError] = useState("");
  const [selectedAlternativeDiagnosis, setSelectedAlternativeDiagnosis] =
    useState(null);
  const [otherAlternativeDiagnosis, setOtherAlternativeDiagnosis] =
    useState("");
  const [alternativeDiagnosisError, setAlternativeDiagnosisError] =
    useState("");
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [expandedPanels, setExpandedPanels] = useState({
    coverage: true,
    patientData: true,
    emergencyContact: true,
    admissionReason: true,
    treatmentTeam: true,
    patientHistory: true,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: createDefaultValues({ admissionAt: referenceAdmissionAt }),
  });

  const {
    fields: emergencyContacts,
    append,
    remove,
    replace: replaceEmergencyContacts,
  } = useFieldArray({
    control,
    name: "emergency_contacts",
  });

  const hasSelectedPatient = Boolean(selectedPatient?.id);
  const diagnosisIsOther = selectedDiagnosis?.code === OTHER_DIAGNOSIS_CODE;
  const alternativeDiagnosisIsOther =
    selectedAlternativeDiagnosis?.code === OTHER_DIAGNOSIS_CODE;
  const selectedCoverageOption = watch("coverage_option");
  const selectedAdmissionAt = watch("admission_at");
  const showCoverageCustomInput = selectedCoverageOption === "Otro";
  const currentAdmissionDateTimeInput = getCurrentDateTimeInput();
  const currentDateInput = toDateInput(new Date());

  const applyPatientToForm = (patientOrNull, antecedentesOrNull = null) => {
    const preserved = pickPreservedValues(getValues());
    reset({
      ...createDefaultValues({
        admissionAt: preserved.admission_at || referenceAdmissionAt,
      }),
      ...preserved,
      ...mapPacienteAntecedentesToFormValues(antecedentesOrNull),
      ...(patientOrNull ? mapPatientToFormValues(patientOrNull) : {}),
    });
  };

  const applyAntecedentesToForm = useCallback((antecedentesOrNull) => {
    const nextAntecedentesValues =
      mapPacienteAntecedentesToFormValues(antecedentesOrNull);

    Object.entries(nextAntecedentesValues).forEach(([fieldName, fieldValue]) => {
      setValue(fieldName, fieldValue);
    });
  }, [setValue]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!pacientePreselected?.id) return;
    setSelectedPatient(pacientePreselected);
    setSearchTerm(formatPatientSearchLabel(pacientePreselected));
    applyPatientToForm(pacientePreselected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacientePreselected?.id]);

  useEffect(() => {
    if (isEditMode) {
      setSelectedTeamMembers([]);
    }
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;

    setValue("admission_at", referenceAdmissionAt);
    setValue(
      "adminission_type",
      normalizeAdminissionType(ingresoPreselected?.adminission_type),
    );
    setValue(
      "admission_reason_notes",
      getAdmissionReasonNotes({
        admissionReason: ingresoPreselected?.admission_reason,
      }),
    );
    setValue(
      "condition_type",
      normalizePacienteConditionType(
        ingresoPreselected?.condition_type ?? pacientePreselected?.condition_type
      ) || "agudo"
    );

    const diagnosisState = getDiagnosisStateFromStoredValue(
      ingresoPreselected?.admission_diagnosis,
    );
    const alternativeDiagnosisState = getDiagnosisStateFromStoredValue(
      ingresoPreselected?.admission_diagnosis_alternative,
    );
    setSelectedDiagnosis(diagnosisState.selectedDiagnosis);
    setOtherDiagnosis(diagnosisState.otherDiagnosis);
    setDiagnosisError("");
    setSelectedAlternativeDiagnosis(
      alternativeDiagnosisState.selectedDiagnosis,
    );
    setOtherAlternativeDiagnosis(alternativeDiagnosisState.otherDiagnosis);
    setAlternativeDiagnosisError("");
  }, [
    ingresoPreselected?.admission_at,
    ingresoPreselected?.adminission_type,
    ingresoPreselected?.admission_diagnosis,
    ingresoPreselected?.admission_diagnosis_alternative,
    ingresoPreselected?.admission_reason,
    ingresoPreselected?.condition_type,
    isEditMode,
    pacientePreselected?.condition_type,
    referenceAdmissionAt,
    setValue,
  ]);

  const { data: searchResults = [], isLoading: loadingSearch } = useQuery({
    queryKey: ["pacientesSearchIngreso", empresaId, sucursalId, debouncedSearch],
    queryFn: () =>
      searchPacientes({
        empresaId,
        sucursalId,
        term: debouncedSearch,
        limit: 12,
      }),
    enabled:
      !isEditMode &&
      Boolean(empresaId) &&
      Boolean(sucursalId) &&
      debouncedSearch.length >= 2,
    refetchOnWindowFocus: false,
  });

  const {
    data: selectedPatientEmergencyContacts,
    isFetching: loadingPatientEmergencyContacts,
  } = useQuery({
    queryKey: ["pacienteContactosEmergencia", selectedPatient?.id],
    queryFn: () =>
      getPacienteContactosEmergenciaByPacienteId(selectedPatient?.id),
    enabled: Boolean(selectedPatient?.id) && isEditMode,
    refetchOnWindowFocus: false,
  });

  const {
    data: selectedPatientCoberturas,
    isFetching: loadingPatientCoberturas,
  } = useQuery({
    queryKey: ["pacienteCoberturas", selectedPatient?.id],
    queryFn: () => getPacienteCoberturasByPacienteId(selectedPatient?.id),
    enabled: Boolean(selectedPatient?.id),
    refetchOnWindowFocus: false,
  });

  const {
    data: selectedPatientAntecedentes,
    isFetching: loadingPatientAntecedentes,
  } = useQuery({
    queryKey: ["pacienteAntecedentes", selectedPatient?.id],
    queryFn: () => getPacienteAntecedentesByPacienteId(selectedPatient?.id),
    enabled: Boolean(selectedPatient?.id),
    refetchOnWindowFocus: false,
  });

  const selectedPatientEmergencyContactsRows =
    selectedPatientEmergencyContacts ?? EMPTY_ARRAY;
  const selectedPatientCoberturasRows =
    selectedPatientCoberturas ?? EMPTY_ARRAY;
  const selectedPatientAntecedentesValues = useMemo(
    () => mapPacienteAntecedentesToFormValues(selectedPatientAntecedentes),
    [selectedPatientAntecedentes],
  );
  const selectedPatientIngresoContacts = useMemo(
    () =>
      resolvePacienteContactosEmergenciaByIngreso(
        selectedPatientEmergencyContactsRows,
        ingresoPreselected,
      ),
    [selectedPatientEmergencyContactsRows, ingresoPreselected],
  );
  const selectedPatientCoverage = useMemo(
    () =>
      resolvePacienteCoberturaByDate(
        selectedPatientCoberturasRows,
        selectedAdmissionAt,
      ) ?? null,
    [selectedPatientCoberturasRows, selectedAdmissionAt],
  );

  useEffect(() => {
    if (!selectedPatient?.id) {
      replaceEmergencyContacts([defaultEmergencyContact()]);
      return;
    }

    if (!isEditMode || !ingresoPreselected?.admission_at) {
      replaceEmergencyContacts([defaultEmergencyContact()]);
      return;
    }

    const mappedContacts = selectedPatientIngresoContacts.map((row) => ({
      id: row?.id ?? undefined,
      name: safeString(row?.name),
      telephone: safeString(row?.telephone),
      vinculo: safeString(row?.vinculo),
      relative: safeString(row?.relative),
      doc_type: safeString(row?.doc_type) || "DNI",
      doc_number:
        row?.doc_number === null || row?.doc_number === undefined
          ? ""
          : String(row.doc_number),
    }));

    replaceEmergencyContacts(
      mappedContacts.length ? mappedContacts : [defaultEmergencyContact()],
    );
  }, [
    selectedPatient?.id,
    ingresoPreselected?.admission_at,
    isEditMode,
    selectedPatientIngresoContacts,
    replaceEmergencyContacts,
  ]);

  useEffect(() => {
    if (!selectedPatient?.id) {
      applyAntecedentesToForm(null);
      return;
    }

    if (loadingPatientAntecedentes) return;

    applyAntecedentesToForm(selectedPatientAntecedentesValues);
  }, [
    applyAntecedentesToForm,
    loadingPatientAntecedentes,
    selectedPatient?.id,
    selectedPatientAntecedentesValues,
  ]);

  useEffect(() => {
    if (!selectedPatient?.id) {
      const emptyCoverageValues = createDefaultCoverageValues();
      setValue("coverage_option", emptyCoverageValues.coverage_option);
      setValue("coverage_custom", emptyCoverageValues.coverage_custom);
      setValue("coverage_notes", emptyCoverageValues.coverage_notes);
      return;
    }

    const nextCoverageValues = mapCoverageToFormValues(selectedPatientCoverage);
    setValue("coverage_option", nextCoverageValues.coverage_option);
    setValue("coverage_custom", nextCoverageValues.coverage_custom);
    setValue("coverage_notes", nextCoverageValues.coverage_notes);
  }, [selectedPatient?.id, selectedPatientCoverage, setValue]);

  const visibleSearchResults = useMemo(() => {
    if (!Array.isArray(searchResults)) return [];
    if (!hasSelectedPatient) return searchResults;
    return searchResults.filter(
      (row) => String(row.id) !== String(selectedPatient?.id),
    );
  }, [searchResults, hasSelectedPatient, selectedPatient?.id]);

  const togglePanel = (key) =>
    setExpandedPanels((prev) => ({ ...prev, [key]: !prev[key] }));

  const handlePickPatient = async (patient) => {
    setSelectedPatient(patient);
    setSearchTerm(formatPatientSearchLabel(patient));
    applyPatientToForm(patient);

    try {
      const antecedentes = await queryClient.fetchQuery({
        queryKey: ["pacienteAntecedentes", patient?.id],
        queryFn: () => getPacienteAntecedentesByPacienteId(patient?.id),
      });

      applyAntecedentesToForm(antecedentes);
    } catch {
      applyAntecedentesToForm(null);
    }
  };

  const handleClearSelectedPatient = () => {
    setSelectedPatient(null);
    setSearchTerm("");
    applyPatientToForm(null);
    replaceEmergencyContacts([defaultEmergencyContact()]);
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (!empresaId) throw new Error("No se encontro la empresa.");
      if (!isEditMode && !sucursalId) {
        throw new Error("Debe seleccionar una sucursal para registrar el ingreso.");
      }

      const pacientePayload = buildPacientePayload({ data, empresaId });
      const diagnosisLabel = getDiagnosisDisplay(
        selectedDiagnosis,
        otherDiagnosis,
      );
      const alternativeDiagnosisLabel = getDiagnosisDisplay(
        selectedAlternativeDiagnosis,
        otherAlternativeDiagnosis,
      );
      const admissionAtIso = toIsoDateTime(data.admission_at);
      const adminissionType = normalizeAdminissionType(data.adminission_type);
      if (!diagnosisLabel) {
        throw new Error("Debe seleccionar un diagnostico de ingreso.");
      }
      if (!admissionAtIso) {
        throw new Error("Debe indicar fecha y hora de ingreso valida.");
      }
      if (!adminissionType) {
        throw new Error("Debe seleccionar un tipo de internacion.");
      }
      if (!safeString(data.admission_reason_notes).trim()) {
        throw new Error("Debe indicar el motivo de internacion.");
      }

      const admissionReason = buildAdmissionReasonValue({
        diagnosisLabel,
        additionalNotes: data.admission_reason_notes,
      });
      const coverageValue = resolveCoverageValueFromForm(data);
      const shouldSyncCoverage = Boolean(coverageValue);
      const previousAdminissionType = normalizeAdminissionType(
        ingresoPreselected?.adminission_type,
      );
      const adminissionTypeChanged =
        Boolean(ingresoPreselected?.id) &&
        previousAdminissionType &&
        previousAdminissionType !== adminissionType;

      if (isEditMode) {
        const currentPaciente = selectedPatient ?? pacientePreselected ?? null;
        const currentPacienteComparable = buildComparablePacientePayload({
          paciente: currentPaciente,
          empresaId,
        });
        const nextPacienteComparable = buildComparablePacientePayload({
          paciente: pacientePayload,
          empresaId,
        });

        let paciente =
          currentPaciente?.id &&
          arePacientePayloadsEqual(
            currentPacienteComparable,
            nextPacienteComparable
          )
            ? currentPaciente
            : currentPaciente?.id
              ? await updatePaciente(currentPaciente.id, pacientePayload)
              : pacientePreselected;

        if (!paciente?.id) throw new Error("No se pudo guardar el paciente.");

        const tasks = [
          syncPacienteContactosEmergenciaByIngreso({
            pacienteId: paciente.id,
            contacts: data.emergency_contacts ?? [],
            effectiveDate: data.admission_at || referenceAdmissionAt,
            scopeIngreso: ingresoPreselected,
          }),
          syncPacienteAntecedentes({
            pacienteId: paciente.id,
            antecedentes: data,
          }),
          shouldSyncCoverage
            ? syncPacienteCoberturaByDate({
                pacienteId: paciente.id,
                effectiveDate: data.admission_at || referenceAdmissionAt,
                coverage: {
                  coverage: coverageValue,
                  coverage_notes: data.coverage_notes,
                },
              })
            : Promise.resolve(null),
        ];

        if (ingresoPreselected?.id) {
          const ingresoUpdatePayload = {
            admission_at: admissionAtIso,
            adminission_type: adminissionType,
            admission_diagnosis: diagnosisLabel,
            admission_diagnosis_alternative: alternativeDiagnosisLabel || null,
            condition_type:
              normalizePacienteConditionType(data.condition_type) || "agudo",
            admission_reason:
              buildAdmissionReasonValue({
                diagnosisLabel,
                additionalNotes: data.admission_reason_notes,
              }) || null,
          };

          if (adminissionTypeChanged) {
            tasks.push(
              updatePacienteIngresoAdminissionType({
                ingresoId: ingresoPreselected.id,
                adminissionType,
              }),
            );
            tasks.push(
              updatePacienteIngreso(ingresoPreselected.id, {
                admission_at: ingresoUpdatePayload.admission_at,
                admission_diagnosis: ingresoUpdatePayload.admission_diagnosis,
                admission_diagnosis_alternative:
                  ingresoUpdatePayload.admission_diagnosis_alternative,
                condition_type: ingresoUpdatePayload.condition_type,
                admission_reason: ingresoUpdatePayload.admission_reason,
              }),
            );
          } else {
            tasks.push(
              updatePacienteIngreso(ingresoPreselected.id, ingresoUpdatePayload),
            );
          }
        }

        await Promise.all(tasks);

        return { paciente, ingreso: null };
      }

      const ingresoPayload = {
        empresa_id: empresaId,
        sucursal_id: sucursalId,
        admission_at: admissionAtIso,
        adminission_type: adminissionType,
        admission_diagnosis: diagnosisLabel,
        admission_diagnosis_alternative: alternativeDiagnosisLabel || null,
        condition_type:
          normalizePacienteConditionType(data.condition_type) || "agudo",
        admission_reason: admissionReason || null,
        status: "admitted",
      };
      let paciente = null;
      let ingreso = null;

      if (selectedPatient?.id) {
        const currentPacienteComparable = buildComparablePacientePayload({
          paciente: selectedPatient,
          empresaId,
        });
        const nextPacienteComparable = buildComparablePacientePayload({
          paciente: pacientePayload,
          empresaId,
        });

        paciente = arePacientePayloadsEqual(
          currentPacienteComparable,
          nextPacienteComparable,
        )
          ? selectedPatient
          : await updatePaciente(selectedPatient.id, pacientePayload);
        const createdIngresoId = await createReingresoPaciente({
          pacienteId: paciente.id,
          ingreso: ingresoPayload,
        });
        ingreso = {
          id: createdIngresoId,
          paciente_id: paciente.id,
          admission_at: admissionAtIso,
          adminission_type: adminissionType,
          discharge_at: null,
          sucursal_id: sucursalId,
        };
      } else {
        const created = await createPacienteConIngreso({
          paciente: pacientePayload,
          ingreso: ingresoPayload,
        });
        if (!created?.paciente_id || !created?.ingreso_id) {
          throw new Error("No se pudo registrar el paciente y su ingreso.");
        }
        paciente = { id: created.paciente_id };
        ingreso = {
          id: created.ingreso_id,
          paciente_id: created.paciente_id,
          admission_at: admissionAtIso,
          adminission_type: adminissionType,
          discharge_at: null,
          sucursal_id: sucursalId,
        };
      }

      if (!paciente?.id) throw new Error("No se pudo guardar el paciente.");

      await Promise.all([
        syncPacienteContactosEmergenciaByIngreso({
          pacienteId: paciente.id,
          contacts: data.emergency_contacts ?? [],
          effectiveDate: data.admission_at,
          scopeIngreso: {
            admission_at: data.admission_at,
            discharge_at: null,
          },
        }),
        shouldSyncCoverage
          ? syncPacienteCoberturaByDate({
              pacienteId: paciente.id,
              effectiveDate: data.admission_at,
              coverage: {
                coverage: coverageValue,
                coverage_notes: data.coverage_notes,
              },
            })
          : Promise.resolve(null),
        syncPacienteAntecedentes({
          pacienteId: paciente.id,
          antecedentes: data,
        }),
      ]);

      if (ingreso?.id && selectedTeamMembers.length) {
        await syncPacienteEquipoTratanteByIngreso({
          pacienteId: paciente.id,
          ingresoId: ingreso.id,
          assignments: selectedTeamMembers,
        });
      }

      return { paciente, ingreso };
    },
    onSuccess: ({ paciente }) => {
      const pacienteQueryId = String(paciente?.id ?? "");
      const patientQueryKeys = [
        ["pacienteDetalle", pacienteQueryId],
        ["pacienteIngresos", pacienteQueryId],
        ["pacienteIngresoAdminissionTypeHistory", pacienteQueryId],
        ["pacienteCoberturas", pacienteQueryId],
        ["pacienteContactosEmergencia", pacienteQueryId],
        ["pacienteAntecedentes", pacienteQueryId],
        ["pacienteEquipo", pacienteQueryId],
      ];

      queryClient.invalidateQueries({ queryKey: ["pacientesActivos"] });
      patientQueryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.refetchQueries({
          queryKey,
          type: "active",
          exact: true,
        });
      });

      Swal.fire({
        icon: "success",
        title: isEditMode
          ? "Paciente actualizado"
          : hasSelectedPatient
            ? "Ingreso registrado"
            : "Paciente e ingreso registrados",
        text: isEditMode
          ? "Se actualizaron los datos del paciente."
          : hasSelectedPatient
            ? "Se registro un nuevo episodio."
            : "Se registro el paciente y su ingreso.",
      });
      onClose?.();
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: getPacienteSaveErrorMessage(
          error,
          isEditMode
            ? "No se pudieron guardar los cambios del paciente."
            : "No se pudo guardar el ingreso.",
        ),
      });
    },
  });

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !mutation.isPending) onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mutation.isPending, onClose]);

  const handleCancelRequest = async () => {
    if (mutation.isPending) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Cancelar",
      text: "¿Estas seguro que queres cancelar?",
      showCancelButton: true,
      confirmButtonText: "Si, cancelar",
      cancelButtonText: "Seguir editando",
      confirmButtonColor: v.rojo,
      cancelButtonColor: v.colorPrincipal,
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      onClose?.();
    }
  };

  const onSubmit = (data) => {
    const shouldValidateDiagnosis =
      !isEditMode || Boolean(ingresoPreselected?.id);

    if (shouldValidateDiagnosis) {
      const diagnosisLabel = getDiagnosisDisplay(
        selectedDiagnosis,
        otherDiagnosis,
      );
      const alternativeDiagnosisLabel = getDiagnosisDisplay(
        selectedAlternativeDiagnosis,
        otherAlternativeDiagnosis,
      );
      if (!diagnosisLabel) {
        setDiagnosisError(
          diagnosisIsOther
            ? "Debe indicar el diagnostico."
            : "Debe seleccionar un diagnostico.",
        );
        return;
      }
      if (alternativeDiagnosisIsOther && !alternativeDiagnosisLabel) {
        setAlternativeDiagnosisError("Debe indicar el diagnostico secundario.");
        return;
      }
    }

    setDiagnosisError("");
    setAlternativeDiagnosisError("");
    mutation.mutate(data);
  };

  return (
    <Overlay>
      <Modal onClick={(event) => event.stopPropagation()}>
        {mutation.isPending && (
          <div className="processingOverlay">
            <Spinner1 />
            <p>
              {isEditMode ? "Guardando cambios..." : "Guardando ingreso..."}
            </p>
          </div>
        )}
        <div className="headers">
          <section>
            <h1>
              {isEditMode
                ? "Editar paciente"
                : hasSelectedPatient
                  ? "Registrar ingreso"
                  : "Registrar paciente / ingreso"}
            </h1>
          </section>
          <section>
            <span onClick={handleCancelRequest}>x</span>
          </section>
        </div>

        {!isEditMode && (
          <div className="searchBox">
            <InputText icono={<v.iconoBuscar />}>
              <input
                className="form__field"
                type="search"
                placeholder="Buscar paciente"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <label className="form__label">
                Buscar paciente (DNI o nombre)
              </label>
            </InputText>

            {!!searchTerm.trim() && !hasSelectedPatient && (
              <div className="suggestions">
                {loadingSearch ? (
                  <div className="suggestionItem muted">
                    Buscando pacientes...
                  </div>
                ) : visibleSearchResults.length ? (
                  visibleSearchResults.map((patient) => (
                    <button
                      type="button"
                      key={patient.id}
                      className="suggestionItem"
                      onClick={() => handlePickPatient(patient)}
                    >
                      <strong>
                        {[patient.first_name, patient.last_name]
                          .filter(Boolean)
                          .join(" ")}
                      </strong>
                      <span>
                        {[patient.document_type, patient.document_number]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                      {patient?.birthday ? (
                        <small>
                          FN:{" "}
                          {toDateInput(patient.birthday)
                            .split("-")
                            .reverse()
                            .join("/")}
                        </small>
                      ) : null}
                    </button>
                  ))
                ) : debouncedSearch.length >= 2 ? (
                  <div className="suggestionItem muted">Sin coincidencias</div>
                ) : null}
              </div>
            )}

            {hasSelectedPatient && (
              <div className="selectedPatientCard">
                <div>
                  <strong>Paciente existente</strong>
                  <p>{formatPatientSearchLabel(selectedPatient)}</p>
                </div>
                <Btn1
                  tipo="button"
                  titulo="Quitar seleccion"
                  bgcolor="var(--bg-surface-muted)"
                  icono={<v.iconocerrar />}
                  funcion={handleClearSelectedPatient}
                />
              </div>
            )}
          </div>
        )}

        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          <AccordionPanel
            title="Cobertura del paciente"
            subtitle={
              loadingPatientCoberturas
                ? "Cargando historial de cobertura..."
                : null
            }
            isOpen={expandedPanels.coverage}
            onToggle={() => togglePanel("coverage")}
          >
            <div className="fieldsGrid">
              <article>
                <InputText icono={<v.iconocategorias />}>
                  <select className="form__field" {...register("coverage_option")}>
                    <option value="">Seleccionar</option>
                    {COVERAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <label className="form__label">Cobertura</label>
                </InputText>
              </article>

              {showCoverageCustomInput ? (
                <article>
                  <InputText icono={<v.iconoempresa />}>
                    <input
                      className="form__field"
                      type="text"
                      placeholder="Nombre de cobertura"
                      {...register("coverage_custom", {
                        validate: (value) =>
                          !showCoverageCustomInput ||
                          safeString(value).trim() ||
                          "Indique la cobertura",
                      })}
                    />
                    <label className="form__label">Otra cobertura</label>
                    {errors.coverage_custom?.message && (
                      <p>{errors.coverage_custom.message}</p>
                    )}
                  </InputText>
                </article>
              ) : null}


              <article>
                <InputText icono={<v.iconoImportante />}>
                  <input
                    className="form__field"
                    type="text"
                    placeholder="Swiss Medical / Plan X / etc..."
                    {...register("coverage_notes")}
                  />
                  <label className="form__label">Detalle</label>
                </InputText>
              </article>
              {false && (
                <article>
                  <InputText icono={<v.iconocodigobarras />}>
                    <input
                      className="form__field"
                      type="text"
                      placeholder="N° de afiliado"
                      {...register("coverage_member_number")}
                    />
                    <label className="form__label">N° de afiliado</label>
                  </InputText>
                </article>
              )}
            </div>
          </AccordionPanel>

          <AccordionPanel
            title="Datos del paciente"
            isOpen={expandedPanels.patientData}
            onToggle={() => togglePanel("patientData")}
          >
            <div className="fieldsGrid">
              <article>
                <InputText icono={<v.icononombre />}>
                  <input
                    className="form__field"
                    type="text"
                    placeholder="Nombre"
                    {...register("first_name", { required: "Campo requerido" })}
                  />
                  <label className="form__label">Nombre</label>
                  {errors.first_name?.message && (
                    <p>{errors.first_name.message}</p>
                  )}
                </InputText>
              </article>
              <article>
                <InputText icono={<v.icononombre />}>
                  <input
                    className="form__field"
                    type="text"
                    placeholder="Apellido"
                    {...register("last_name", { required: "Campo requerido" })}
                  />
                  <label className="form__label">Apellido</label>
                  {errors.last_name?.message && (
                    <p>{errors.last_name.message}</p>
                  )}
                </InputText>
              </article>

              <article>
                <InputText icono={<v.iconodocumento />}>
                  <select
                    className="form__field"
                    {...register("document_type", {
                      validate: (value) =>
                        safeString(getValues("document_number")).trim() &&
                        !safeString(value).trim()
                          ? "Seleccione tipo de documento"
                          : true,
                    })}
                  >
                    <option value="">Sin especificar</option>
                    <option value="DNI">DNI</option>
                    <option value="LC">LC</option>
                    <option value="LE">LE</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <label className="form__label">Tipo de documento</label>
                  {errors.document_type?.message && (
                    <p>{errors.document_type.message}</p>
                  )}
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconocodigobarras />}>
                  <input
                    className="form__field"
                    type="text"
                    placeholder="N° de documento"
                    {...register("document_number", {
                      validate: (value) =>
                        safeString(value).trim() &&
                        !safeString(getValues("document_type")).trim()
                          ? "Seleccione tipo de documento"
                          : true,
                    })}
                  />
                  <label className="form__label">N° de documento</label>
                  {errors.document_number?.message && (
                    <p>{errors.document_number.message}</p>
                  )}
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoCalendario />}>
                  <input
                    className="form__field"
                    type="date"
                    max={currentDateInput}
                    {...register("birthday", {
                      validate: (value) =>
                        !safeString(value).trim() ||
                        safeString(value).trim() <= currentDateInput ||
                        "La fecha de nacimiento no puede ser posterior a hoy",
                    })}
                  />
                  <label className="form__label">Fecha de nacimiento</label>
                  {errors.birthday?.message && <p>{errors.birthday.message}</p>}
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoUser />}>
                  <select className="form__field" {...register("genre")}>
                    <option value="">Sin especificar</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="No binario">No binario</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <label className="form__label">Genero</label>
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoTelephone />}>
                  <input
                    className="form__field"
                    type="text"
                    placeholder="Telefono"
                    {...register("telephone")}
                  />
                  <label className="form__label">Telefono</label>
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoemail />}>
                  <input
                    className="form__field"
                    type="email"
                    placeholder="Email"
                    {...register("email", {
                      validate: (value) =>
                        !safeString(value).trim() ||
                        /\S+@\S+\.\S+/.test(value) ||
                        "Email invalido",
                    })}
                  />
                  <label className="form__label">Email</label>
                  {errors.email?.message && <p>{errors.email.message}</p>}
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoubicacion />}>
                  <input
                    className="form__field"
                    type="text"
                    placeholder="Direccion"
                    {...register("address")}
                  />
                  <label className="form__label">Direccion</label>
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoubicacion />}>
                  <input
                    className="form__field"
                    type="text"
                    placeholder="Localidad"
                    {...register("localidad")}
                  />
                  <label className="form__label">Localidad</label>
                </InputText>
              </article>

              <article>
                <InputText icono={<v.iconoUser />}>
                  <select className="form__field" {...register("estado_civil")}>
                    <option value="">Sin especificar</option>
                    <option value="Soltero">Soltero</option>
                    <option value="Casado">Casado</option>
                    <option value="Viudo">Viudo</option>
                    <option value="Divorciado">Divorciado</option>
                  </select>
                  <label className="form__label">Estado civil</label>
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoUser />}>
                  <select className="form__field" {...register("convivencia")}>
                    <option value="">Sin especificar</option>
                    <option value="Acompañado">Acompañado</option>
                    <option value="Solo">Solo</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <label className="form__label">Convivencia</label>
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconocategorias />}>
                  <select className="form__field" {...register("educacion")}>
                    <option value="">Sin especificar</option>
                    <option value="Primaria">Primaria</option>
                    <option value="Secundario">Secundario</option>
                    <option value="Terciario">Terciario</option>
                    <option value="Universitario">Universitario</option>
                    <option value="Caso especial">Caso especial</option>
                  </select>
                  <label className="form__label">Educacion</label>
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoCheck />}>
                  <select className="form__field" {...register("alfabetizado")}>
                    <option value="">Sin especificar</option>
                    <option value="true">Si</option>
                    <option value="false">No</option>
                  </select>
                  <label className="form__label">Sabe leer y escribir</label>
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoProfesional />}>
                  <input
                    className="form__field"
                    type="text"
                    placeholder="Ocupacion"
                    {...register("ocupacion")}
                  />
                  <label className="form__label">Ocupacion</label>
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoUser />}>
                  <input
                    className="form__field"
                    type="text"
                    placeholder="Religion"
                    {...register("religion")}
                  />
                  <label className="form__label">Religion</label>
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoubicacion />}>
                  <input
                    className="form__field"
                    type="text"
                    placeholder="Lugar de nacimiento"
                    {...register("lugar_nacimiento")}
                  />
                  <label className="form__label">Lugar de nacimiento</label>
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoNumbers />}>
                  <input
                    className="form__field"
                    type="number"
                    min="0"
                    placeholder="Cantidad de hijos"
                    {...register("hijos", {
                      validate: (value) =>
                        safeString(value).trim() === "" ||
                        (Number.isFinite(Number(value)) &&
                          Number(value) >= 0) ||
                        "Debe ser un numero mayor o igual a 0",
                    })}
                  />
                  <label className="form__label">Cantidad de hijos</label>
                  {errors.hijos?.message && <p>{errors.hijos.message}</p>}
                </InputText>
              </article>
            </div>
          </AccordionPanel>

          <AccordionPanel
            title="Contacto de emergencia"
            subtitle={
              loadingPatientEmergencyContacts
                ? "Cargando contactos..."
                : "Puede agregar mas de un contacto"
            }
            isOpen={expandedPanels.emergencyContact}
            onToggle={() => togglePanel("emergencyContact")}
          >
            <EmergencyContactsSection
              control={control}
              register={register}
              errors={errors}
              fields={emergencyContacts}
              append={append}
              remove={remove}
              name="emergency_contacts"
              variant="paciente"
              showDocFields
            />
          </AccordionPanel>

          {(!isEditMode || ingresoPreselected?.id) && (
            <AccordionPanel
              title="Motivo de internacion"
              isOpen={expandedPanels.admissionReason}
              onToggle={() => togglePanel("admissionReason")}
            >
              <div className="fieldsGrid">
                <article>
                  <InputText icono={<v.iconoCalendario />}>
                    <input
                      className="form__field"
                      type="datetime-local"
                      max={currentAdmissionDateTimeInput}
                      {...register("admission_at", {
                        required: "Campo requerido",
                        validate: (value) =>
                          !safeString(value).trim() ||
                          safeString(value).trim() <=
                            currentAdmissionDateTimeInput ||
                          "La fecha y hora de ingreso no puede ser mayor al momento actual",
                      })}
                    />
                    <label className="form__label">
                      Fecha y hora de ingreso
                    </label>
                    {errors.admission_at?.message && (
                      <p>{errors.admission_at.message}</p>
                    )}
                  </InputText>
                </article>
                <article>
                  <InputText icono={<v.iconoImportante />}>
                    <select
                      className="form__field"
                      {...register("adminission_type", {
                        validate: (value) =>
                          normalizeAdminissionType(value)
                            ? true
                            : "Seleccione un tipo de internacion",
                      })}
                    >
                      <option value="">Seleccionar</option>
                      {ADMINISSION_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <label className="form__label">Tipo de internacion</label>
                    {errors.adminission_type?.message && (
                      <p>{errors.adminission_type.message}</p>
                    )}
                  </InputText>
                </article>
                <article className="full">
                  <InputText icono={<v.iconoImportante />}>
                    <textarea
                      className="form__field"
                      rows={3}
                      placeholder="Motivo de internacion"
                      {...register("admission_reason_notes", {
                        validate: (value) =>
                          safeString(value).trim()
                            ? true
                            : "Campo requerido",
                      })}
                    />
                    <label className="form__label">
                      Motivo de internacion
                    </label>
                    {errors.admission_reason_notes?.message && (
                      <p>{errors.admission_reason_notes.message}</p>
                    )}
                  </InputText>
                </article>
                <article>
                  <InputText icono={<v.iconoImportante />}>
                    <select
                      className="form__field"
                      {...register("condition_type")}
                    >
                      {PACIENTE_CONDITION_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <label className="form__label">Condicion</label>
                  </InputText>
                </article>
                <article className="full">
                  <Icd10TreeSelect
                    value={selectedDiagnosis}
                    onChange={(value) => {
                      setSelectedDiagnosis(value);
                      setDiagnosisError("");
                      if (value?.code !== OTHER_DIAGNOSIS_CODE)
                        setOtherDiagnosis("");
                    }}
                    label="Diagnostico de ingreso (ICD-10)"
                    error={diagnosisError}
                    allowOther
                    icono={<v.iconoImportante />}
                  />
                </article>
                {diagnosisIsOther && (
                  <article className="full">
                    <InputText icono={<v.iconoImportante />}>
                      <textarea
                        className="form__field textarea"
                        rows={3}
                        placeholder="Indique diagnostico"
                        value={otherDiagnosis}
                        onChange={(e) => {
                          setOtherDiagnosis(e.target.value);
                          if (e.target.value.trim()) setDiagnosisError("");
                        }}
                      />
                      <label className="form__label">Indique diagnostico</label>
                    </InputText>
                  </article>
                )}
                <article className="full">
                  <Icd10TreeSelect
                    value={selectedAlternativeDiagnosis}
                    onChange={(value) => {
                      setSelectedAlternativeDiagnosis(value);
                      setAlternativeDiagnosisError("");
                      if (value?.code !== OTHER_DIAGNOSIS_CODE) {
                        setOtherAlternativeDiagnosis("");
                      }
                    }}
                    label="Diagnostico secundario de ingreso (ICD-10)"
                    error={alternativeDiagnosisError}
                    allowOther
                    icono={<v.iconoImportante />}
                  />
                </article>
                {alternativeDiagnosisIsOther && (
                  <article className="full">
                    <InputText icono={<v.iconoImportante />}>
                      <textarea
                        className="form__field textarea"
                        rows={3}
                        placeholder="Indique diagnostico secundario"
                        value={otherAlternativeDiagnosis}
                        onChange={(e) => {
                          setOtherAlternativeDiagnosis(e.target.value);
                          if (e.target.value.trim()) {
                            setAlternativeDiagnosisError("");
                          }
                        }}
                      />
                      <label className="form__label">
                        Indique diagnostico secundario
                      </label>
                    </InputText>
                  </article>
                )}
              </div>
            </AccordionPanel>
          )}

          {!isEditMode && (
            <AccordionPanel
              title="Equipo tratante"
              subtitle="La asignacion del equipo y el area configurada en Permisos definen la elegibilidad clinica por internacion."
              isOpen={expandedPanels.treatmentTeam}
              onToggle={() => togglePanel("treatmentTeam")}
            >
              <PacienteEquipoTratanteSection
                empresaId={empresaId}
                value={selectedTeamMembers}
                onChange={setSelectedTeamMembers}
                disabled={mutation.isPending}
              />
            </AccordionPanel>
          )}

          <AccordionPanel
            title="Antecedentes del paciente"
            subtitle={
              loadingPatientAntecedentes
                ? "Cargando antecedentes..."
                : "Antecedentes personales, clínicos y examen psicopatológico"
            }
            isOpen={expandedPanels.patientHistory}
            onToggle={() => togglePanel("patientHistory")}
          >
            <PacienteAntecedentesSection
              control={control}
              register={register}
              setValue={setValue}
              loading={loadingPatientAntecedentes}
            />
          </AccordionPanel>

          <div className="acciones">
            <Btn1
              tipo="button"
              icono={<v.iconocerrar />}
              titulo="Cancelar"
              bgcolor="var(--bg-surface-muted)"
              disabled={mutation.isPending}
              funcion={handleCancelRequest}
            />
            <Btn1
              icono={<v.iconoguardar />}
              titulo={
                mutation.isPending
                  ? "Guardando..."
                  : isEditMode
                    ? "Guardar cambios"
                    : "Guardar ingreso"
              }
              bgcolor={v.colorPrincipal}
              disabled={mutation.isPending}
            />
          </div>
        </form>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  background-color: var(--overlay-backdrop);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 16px;
  overflow-y: auto;
`;

const Modal = styled.div`
  position: relative;
  width: min(980px, 100%);
  max-height: calc(100dvh - 48px);
  background: ${({ theme }) => theme.bgtotal};
  border-radius: 18px;
  box-shadow: var(--shadow-elev-1);
  padding: 18px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: auto 0;

  @media ${Device.mobile} {
    padding: 22px;
    border-radius: 20px;
  }

  .headers {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    h1 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }
    span {
      font-size: 22px;
      line-height: 1;
      cursor: pointer;
      user-select: none;
    }
  }

  .processingOverlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: var(--overlay-backdrop);
    display: grid;
    place-items: center;
    gap: 10px;
    padding: 24px;
    text-align: center;
  }

  .processingOverlay p {
    margin: 0;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }

  .searchBox {
    display: grid;
    gap: 10px;
    margin-bottom: 14px;
  }

  .suggestions {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    background: ${({ theme }) => theme.bg};
    box-shadow: var(--shadow-elev-1);
    max-height: 220px;
    overflow: auto;
    display: grid;
    gap: 4px;
    padding: 8px;
  }

  .suggestionItem {
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.text};
    text-align: left;
    padding: 8px 10px;
    border-radius: 10px;
    display: grid;
    gap: 2px;
    cursor: pointer;
    span,
    small {
      color: ${({ theme }) => theme.textsecundary};
    }
  }
  .suggestionItem:hover {
    background: ${({ theme }) => theme.color2};
  }
  .suggestionItem.muted {
    cursor: default;
  }
  .suggestionItem.muted:hover {
    background: transparent;
  }

  .selectedPatientCard {
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bg};
    border-radius: 14px;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    p {
      margin: 4px 0 0;
      color: ${({ theme }) => theme.textsecundary};
    }
  }

  .formulario {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding-right: 8px;
    padding-bottom: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scrollbar-gutter: stable;
  }

  .accordionPanel {
    flex: 0 0 auto;
  }

  .accordionPanel {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    background: ${({ theme }) => theme.bg};
    overflow: visible;
    position: relative;
  }
  .accordionHeader {
    width: 100%;
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.text};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 14px;
    text-align: left;
    cursor: pointer;
  }
  .accordionHeader:hover {
    background: ${({ theme }) => theme.color2};
  }
  .headerTexts {
    display: grid;
    gap: 2px;
  }
  .headerTexts .title {
    font-weight: 700;
    font-size: 16px;
  }
  .headerTexts small {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.textsecundary};
  }
  .accordionAction {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.color1};
    flex: 0 0 auto;
  }
  .accordionAction.expanded .chevron {
    transform: rotate(180deg);
  }
  .actionLabel {
    font-size: 0.82rem;
    font-weight: 700;
    color: ${({ theme }) => theme.textsecundary};
  }
  .chevron {
    color: ${({ theme }) => theme.color1};
    font-size: 0.95rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 160ms ease;
  }
  .accordionBody {
    border-top: 1px solid ${({ theme }) => theme.color2};
    padding: 12px 14px 14px;
    overflow: visible;
  }

  .fieldsGrid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px 18px;
    @media ${Device.tablet} {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    article.full {
      grid-column: 1 / -1;
    }

    article {
      min-width: 0;
    }
  }

  .textarea {
    resize: vertical;
    min-height: 108px;
    padding-top: 12px;
  }

  .contactList {
    display: grid;
    gap: 12px;
  }
  .contactCard {
    border: 1px dashed ${({ theme }) => theme.color2};
    border-radius: 12px;
    padding: 10px;
    display: grid;
    gap: 10px;
  }
  .contactHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }
  .linkButton {
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    font-weight: 700;
    color: ${({ theme }) => theme.color1};
  }
  .linkButton.danger {
    color: var(--color-danger);
  }
  .inlineActions {
    display: flex;
    justify-content: flex-start;
  }

  .acciones {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 4px;
    margin-top: 4px;
    position: static;
    background: transparent;
    padding-bottom: 0;
    @media ${DeviceMax.mobile} {
      flex-direction: column-reverse;
      align-items: stretch;
    }
  }
`;
