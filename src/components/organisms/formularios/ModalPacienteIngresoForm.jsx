import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  Btn1,
  EmergencyContactsSection,
  Icd10TreeSelect,
  InputText,
  PacienteAntecedentesSection,
  Spinner1,
} from "../../../index";
import {
  getCoberturasFinanciadoresByTipo,
  getCoberturasPlanesByFinanciadorId,
  insertPaciente,
  insertPacienteIngreso,
  getPacienteCoberturasByPacienteId,
  resolvePacienteCoberturaByDate,
  searchPacientes,
  syncPacienteCoberturaByDate,
  updatePacienteIngreso,
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
import { Device, DeviceMax } from "../../../styles/breakpoints";
import { v } from "../../../styles/variables";

const OTHER_DIAGNOSIS_CODE = "OTHER";

const defaultEmergencyContact = () => createEmptyEmergencyContact("paciente");
const getCurrentDateTimeInput = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};
const createDefaultCoverageValues = () => ({
  coverage_type: "",
  coverage_financiador_id: "",
  coverage_plan_id: "",
  coverage_member_number: "",
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
  condition_type: "agudo",
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
  admission_reason_notes: "",
});

const EMPTY_ARRAY = [];

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value);

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
  condition_type: safeString(patient?.condition_type) || "agudo",
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
  coverage_type: safeString(coverage?.coverage_type),
  coverage_financiador_id: coverage?.financiador_id
    ? String(coverage.financiador_id)
    : "",
  coverage_plan_id: coverage?.plan_id ? String(coverage.plan_id) : "",
  coverage_member_number: safeString(coverage?.affiliate_number),
  coverage_notes: safeString(coverage?.coverage_notes),
});

const pickPreservedValues = (values) => ({
  admission_at:
    toDateTimeLocalInput(values?.admission_at) || getCurrentDateTimeInput(),
  admission_reason_notes: safeString(values?.admission_reason_notes),
  emergency_contacts: [defaultEmergencyContact()],
});

const buildPacientePayload = ({ data, empresaId }) => {
  const n = (value) => {
    const trimmed = safeString(value).trim();
    return trimmed ? trimmed : null;
  };
  const hijosRaw = safeString(data.hijos).trim();
  return {
    empresa_id: empresaId,
    first_name: safeString(data.first_name).trim(),
    last_name: safeString(data.last_name).trim(),
    document_type: n(data.document_type),
    document_number: n(data.document_number),
    birthday: data.birthday || null,
    genre: n(data.genre),
    telephone: n(data.telephone),
    email: n(data.email),
    address: n(data.address),
    localidad: n(data.localidad),
    condition_type: safeString(data.condition_type).trim() || "agudo",
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
    hijos: hijosRaw === "" ? null : Number(hijosRaw),
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
  const normalizedDiagnosis = safeString(diagnosisLabel).trim();
  const normalizedNotes = safeString(additionalNotes).trim();

  return [
    normalizedDiagnosis ? `Diagnostico: ${normalizedDiagnosis}` : "",
    normalizedNotes ? `Motivos de internacion: ${normalizedNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

const getAdmissionReasonNotes = ({ admissionReason, diagnosis }) => {
  const rawReason = safeString(admissionReason).trim();
  const rawDiagnosis = safeString(diagnosis).trim();
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
  if (rawDiagnosis && rawReason === rawDiagnosis) return "";
  if (lines.some((line) => line.toLowerCase().startsWith("diagnostico:")))
    return "";
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
  const [coveragePrefillTarget, setCoveragePrefillTarget] = useState(null);
  const [expandedPanels, setExpandedPanels] = useState({
    coverage: true,
    patientData: true,
    emergencyContact: true,
    admissionReason: true,
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
  const selectedCoverageType = watch("coverage_type");
  const selectedCoverageFinanciadorId = watch("coverage_financiador_id");
  const selectedCoveragePlanId = watch("coverage_plan_id");
  const selectedAdmissionAt = watch("admission_at");
  const showCoverageFinanciador =
    selectedCoverageType === "prepaga" ||
    selectedCoverageType === "obra_social";
  const currentAdmissionDateTimeInput = getCurrentDateTimeInput();
  const currentDateInput = toDateInput(new Date());

  const applyPatientToForm = (patientOrNull) => {
    const preserved = pickPreservedValues(getValues());
    reset({
      ...createDefaultValues({
        admissionAt: preserved.admission_at || referenceAdmissionAt,
      }),
      ...preserved,
      ...(patientOrNull ? mapPatientToFormValues(patientOrNull) : {}),
    });
  };

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
    if (!isEditMode) return;

    setValue("admission_at", referenceAdmissionAt);
    setValue(
      "admission_reason_notes",
      getAdmissionReasonNotes({
        admissionReason: ingresoPreselected?.admission_reason,
        diagnosis: ingresoPreselected?.admission_diagnosis,
      }),
    );

    const diagnosisState = getDiagnosisStateFromStoredValue(
      ingresoPreselected?.admission_diagnosis,
    );
    setSelectedDiagnosis(diagnosisState.selectedDiagnosis);
    setOtherDiagnosis(diagnosisState.otherDiagnosis);
    setDiagnosisError("");
  }, [
    ingresoPreselected?.admission_at,
    ingresoPreselected?.admission_diagnosis,
    ingresoPreselected?.admission_reason,
    isEditMode,
    referenceAdmissionAt,
    setValue,
  ]);

  const { data: searchResults = [], isLoading: loadingSearch } = useQuery({
    queryKey: ["pacientesSearchIngreso", empresaId, debouncedSearch],
    queryFn: () =>
      searchPacientes({ empresaId, term: debouncedSearch, limit: 12 }),
    enabled: !isEditMode && Boolean(empresaId) && debouncedSearch.length >= 2,
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

  const {
    data: coverageFinanciadores = [],
    isLoading: loadingCoverageFinanciadores,
    isFetched: coverageFinanciadoresFetched,
  } = useQuery({
    queryKey: ["coberturasFinanciadores", selectedCoverageType],
    queryFn: () => getCoberturasFinanciadoresByTipo(selectedCoverageType),
    enabled: showCoverageFinanciador,
    refetchOnWindowFocus: false,
  });

  const {
    data: coveragePlanes = [],
    isLoading: loadingCoveragePlanes,
    isFetched: coveragePlanesFetched,
  } = useQuery({
    queryKey: [
      "coberturasPlanes",
      selectedCoverageType,
      selectedCoverageFinanciadorId,
    ],
    queryFn: () =>
      getCoberturasPlanesByFinanciadorId(selectedCoverageFinanciadorId),
    enabled: showCoverageFinanciador && Boolean(selectedCoverageFinanciadorId),
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
  const coverageFinanciadoresOptions = useMemo(() => {
    if (!coveragePrefillTarget?.coverage_financiador_id)
      return coverageFinanciadores;

    const currentFinanciador = selectedPatientCoverage?.financiador;
    if (!currentFinanciador?.id) return coverageFinanciadores;

    return coverageFinanciadores.some(
      (item) => String(item.id) === String(currentFinanciador.id),
    )
      ? coverageFinanciadores
      : [currentFinanciador, ...coverageFinanciadores];
  }, [
    coverageFinanciadores,
    coveragePrefillTarget?.coverage_financiador_id,
    selectedPatientCoverage?.financiador,
  ]);
  const coveragePlanesOptions = useMemo(() => {
    if (!coveragePrefillTarget?.coverage_plan_id) return coveragePlanes;

    const currentPlan = selectedPatientCoverage?.plan;
    if (!currentPlan?.id) return coveragePlanes;

    return coveragePlanes.some(
      (item) => String(item.id) === String(currentPlan.id),
    )
      ? coveragePlanes
      : [currentPlan, ...coveragePlanes];
  }, [
    coveragePlanes,
    coveragePrefillTarget?.coverage_plan_id,
    selectedPatientCoverage?.plan,
  ]);
  const isCoveragePrefilling =
    Boolean(coveragePrefillTarget) &&
    safeString(selectedCoverageType).trim() ===
      safeString(coveragePrefillTarget?.coverage_type).trim();

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
    const nextAntecedentesValues = selectedPatient?.id
      ? selectedPatientAntecedentesValues
      : createDefaultPacienteAntecedentesFormValues();

    Object.entries(nextAntecedentesValues).forEach(
      ([fieldName, fieldValue]) => {
        setValue(fieldName, fieldValue);
      },
    );
  }, [selectedPatient?.id, selectedPatientAntecedentesValues, setValue]);

  useEffect(() => {
    if (!selectedPatient?.id) {
      const emptyCoverageValues = createDefaultCoverageValues();
      setValue("coverage_type", emptyCoverageValues.coverage_type);
      setValue(
        "coverage_financiador_id",
        emptyCoverageValues.coverage_financiador_id,
      );
      setValue("coverage_plan_id", emptyCoverageValues.coverage_plan_id);
      setValue(
        "coverage_member_number",
        emptyCoverageValues.coverage_member_number,
      );
      setValue("coverage_notes", emptyCoverageValues.coverage_notes);
      setCoveragePrefillTarget(null);
      return;
    }

    const nextCoverageValues = mapCoverageToFormValues(selectedPatientCoverage);
    setValue("coverage_type", nextCoverageValues.coverage_type);
    setValue(
      "coverage_financiador_id",
      nextCoverageValues.coverage_financiador_id,
    );
    setValue("coverage_plan_id", nextCoverageValues.coverage_plan_id);
    setValue(
      "coverage_member_number",
      nextCoverageValues.coverage_member_number,
    );
    setValue("coverage_notes", nextCoverageValues.coverage_notes);
    setCoveragePrefillTarget(
      nextCoverageValues.coverage_type &&
        nextCoverageValues.coverage_type !== "particular" &&
        nextCoverageValues.coverage_financiador_id
        ? nextCoverageValues
        : null,
    );
  }, [selectedPatient?.id, selectedPatientCoverage, setValue]);

  useEffect(() => {
    if (!coveragePrefillTarget || !selectedPatient?.id) return;
    if (
      safeString(selectedCoverageType).trim() !==
      safeString(coveragePrefillTarget.coverage_type).trim()
    )
      return;

    if (
      coveragePrefillTarget.coverage_financiador_id &&
      (loadingCoverageFinanciadores || !coverageFinanciadoresFetched)
    ) {
      return;
    }

    if (
      coveragePrefillTarget.coverage_financiador_id &&
      !coverageFinanciadoresOptions.some(
        (item) =>
          String(item.id) ===
          String(coveragePrefillTarget.coverage_financiador_id),
      )
    ) {
      setCoveragePrefillTarget(null);
      return;
    }

    if (
      coveragePrefillTarget.coverage_financiador_id &&
      safeString(selectedCoverageFinanciadorId).trim() !==
        coveragePrefillTarget.coverage_financiador_id
    ) {
      setValue(
        "coverage_financiador_id",
        coveragePrefillTarget.coverage_financiador_id,
      );
      return;
    }

    if (!coveragePrefillTarget.coverage_plan_id) {
      setCoveragePrefillTarget(null);
      return;
    }

    if (loadingCoveragePlanes || !coveragePlanesFetched) {
      return;
    }

    if (
      !coveragePlanesOptions.some(
        (item) =>
          String(item.id) === String(coveragePrefillTarget.coverage_plan_id),
      )
    ) {
      setCoveragePrefillTarget(null);
      return;
    }

    if (
      safeString(selectedCoveragePlanId).trim() !==
      coveragePrefillTarget.coverage_plan_id
    ) {
      setValue("coverage_plan_id", coveragePrefillTarget.coverage_plan_id);
      return;
    }

    setCoveragePrefillTarget(null);
  }, [
    coverageFinanciadoresFetched,
    coverageFinanciadoresOptions,
    coveragePlanesFetched,
    coveragePlanesOptions,
    coveragePrefillTarget,
    loadingCoverageFinanciadores,
    loadingCoveragePlanes,
    selectedCoverageFinanciadorId,
    selectedCoveragePlanId,
    selectedPatient?.id,
    selectedCoverageType,
    setValue,
  ]);

  useEffect(() => {
    if (selectedCoverageType !== "particular") return;
    setValue("coverage_financiador_id", "");
    setValue("coverage_plan_id", "");
    setValue("coverage_member_number", "");
  }, [selectedCoverageType, setValue]);

  useEffect(() => {
    if (isCoveragePrefilling) return;
    if (!showCoverageFinanciador) return;
    if (!selectedCoverageFinanciadorId) {
      if (selectedCoveragePlanId) setValue("coverage_plan_id", "");
      return;
    }
    if (loadingCoverageFinanciadores || !coverageFinanciadoresFetched) return;

    const financiadorExists = coverageFinanciadoresOptions.some(
      (item) => String(item.id) === String(selectedCoverageFinanciadorId),
    );
    if (!financiadorExists) {
      setValue("coverage_financiador_id", "");
      setValue("coverage_plan_id", "");
    }
  }, [
    coverageFinanciadoresOptions,
    coverageFinanciadoresFetched,
    isCoveragePrefilling,
    loadingCoverageFinanciadores,
    selectedCoverageFinanciadorId,
    selectedCoveragePlanId,
    setValue,
    showCoverageFinanciador,
  ]);

  useEffect(() => {
    if (isCoveragePrefilling) return;
    if (!showCoverageFinanciador || !selectedCoverageFinanciadorId) {
      if (selectedCoveragePlanId) setValue("coverage_plan_id", "");
      return;
    }
    if (loadingCoveragePlanes || !coveragePlanesFetched) return;

    if (!coveragePlanesOptions.length) {
      if (selectedCoveragePlanId) setValue("coverage_plan_id", "");
      return;
    }

    const currentPlanExists = coveragePlanesOptions.some(
      (item) => String(item.id) === String(selectedCoveragePlanId),
    );
    if (!currentPlanExists) {
      setValue(
        "coverage_plan_id",
        coveragePlanesOptions.length === 1
          ? String(coveragePlanesOptions[0].id)
          : "",
      );
    }
  }, [
    coveragePlanesOptions,
    coveragePlanesFetched,
    isCoveragePrefilling,
    loadingCoveragePlanes,
    selectedCoverageFinanciadorId,
    selectedCoveragePlanId,
    setValue,
    showCoverageFinanciador,
  ]);

  const visibleSearchResults = useMemo(() => {
    if (!Array.isArray(searchResults)) return [];
    if (!hasSelectedPatient) return searchResults;
    return searchResults.filter(
      (row) => String(row.id) !== String(selectedPatient?.id),
    );
  }, [searchResults, hasSelectedPatient, selectedPatient?.id]);

  const togglePanel = (key) =>
    setExpandedPanels((prev) => ({ ...prev, [key]: !prev[key] }));

  const handlePickPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchTerm(formatPatientSearchLabel(patient));
    applyPatientToForm(patient);
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

      const pacientePayload = buildPacientePayload({ data, empresaId });
      let paciente;
      if (selectedPatient?.id)
        paciente = await updatePaciente(selectedPatient.id, pacientePayload);
      else paciente = await insertPaciente(pacientePayload);

      if (!paciente?.id) throw new Error("No se pudo guardar el paciente.");

      const shouldSyncCoverage = safeString(data.coverage_type).trim();

      if (isEditMode) {
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
                  coverage_type: data.coverage_type,
                  financiador_id: data.coverage_financiador_id,
                  plan_id: data.coverage_plan_id,
                  affiliate_number: data.coverage_member_number,
                  coverage_notes: data.coverage_notes,
                },
              })
            : Promise.resolve(null),
        ];

        if (ingresoPreselected?.id) {
          const diagnosisLabel = getDiagnosisDisplay(
            selectedDiagnosis,
            otherDiagnosis,
          );
          if (!diagnosisLabel) {
            throw new Error("Debe seleccionar un diagnostico de ingreso.");
          }

          const admissionAtIso = toIsoDateTime(data.admission_at);
          if (!admissionAtIso) {
            throw new Error("Debe indicar fecha y hora de ingreso valida.");
          }

          tasks.push(
            updatePacienteIngreso(ingresoPreselected.id, {
              admission_at: admissionAtIso,
              admission_diagnosis: diagnosisLabel,
              admission_reason:
                buildAdmissionReasonValue({
                  diagnosisLabel,
                  additionalNotes: data.admission_reason_notes,
                }) || null,
            }),
          );
        }

        await Promise.all(tasks);

        return { paciente, ingreso: null };
      }

      const diagnosisLabel = getDiagnosisDisplay(
        selectedDiagnosis,
        otherDiagnosis,
      );
      if (!diagnosisLabel)
        throw new Error("Debe seleccionar un diagnostico de ingreso.");
      const admissionAtIso = toIsoDateTime(data.admission_at);
      if (!admissionAtIso)
        throw new Error("Debe indicar fecha y hora de ingreso valida.");
      const admissionReason = buildAdmissionReasonValue({
        diagnosisLabel,
        additionalNotes: data.admission_reason_notes,
      });

      const ingresoPayload = {
        empresa_id: empresaId,
        paciente_id: paciente.id,
        admission_at: admissionAtIso,
        admission_diagnosis: diagnosisLabel,
        admission_reason: admissionReason || null,
        status: "admitted",
      };
      const [, , , ingreso] = await Promise.all([
        syncPacienteContactosEmergenciaByIngreso({
          pacienteId: paciente.id,
          contacts: data.emergency_contacts ?? [],
          effectiveDate: data.admission_at,
          scopeIngreso: {
            admission_at: data.admission_at,
            discharge_at: null,
          },
        }),
        syncPacienteCoberturaByDate({
          pacienteId: paciente.id,
          effectiveDate: data.admission_at,
          coverage: {
            coverage_type: data.coverage_type,
            financiador_id: data.coverage_financiador_id,
            plan_id: data.coverage_plan_id,
            affiliate_number: data.coverage_member_number,
            coverage_notes: data.coverage_notes,
          },
        }),
        syncPacienteAntecedentes({
          pacienteId: paciente.id,
          antecedentes: data,
        }),
        insertPacienteIngreso(ingresoPayload),
      ]);
      return { paciente, ingreso };
    },
    onSuccess: ({ paciente }) => {
      const pacienteQueryId = String(paciente?.id ?? "");
      const patientQueryKeys = [
        ["pacienteDetalle", pacienteQueryId],
        ["pacienteIngresos", pacienteQueryId],
        ["pacienteCoberturas", pacienteQueryId],
        ["pacienteContactosEmergencia", pacienteQueryId],
        ["pacienteAntecedentes", pacienteQueryId],
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

  const onSubmit = (data) => {
    const shouldValidateDiagnosis =
      !isEditMode || Boolean(ingresoPreselected?.id);

    if (shouldValidateDiagnosis) {
      const diagnosisLabel = getDiagnosisDisplay(
        selectedDiagnosis,
        otherDiagnosis,
      );
      if (!diagnosisLabel) {
        setDiagnosisError(
          diagnosisIsOther
            ? "Debe indicar el diagnostico."
            : "Debe seleccionar un diagnostico.",
        );
        return;
      }
    }

    setDiagnosisError("");
    mutation.mutate(data);
  };

  return (
    <Overlay
      onClick={(event) =>
        event.target === event.currentTarget &&
        !mutation.isPending &&
        onClose?.()
      }
    >
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
            <span onClick={() => !mutation.isPending && onClose?.()}>x</span>
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
                  <select
                    className="form__field"
                    {...register("coverage_type", {
                      validate: (value) =>
                        isEditMode || safeString(value).trim()
                          ? true
                          : "Seleccione un tipo de cobertura",
                    })}
                  >
                    <option value="">Seleccionar</option>
                    <option value="obra_social">Obra social</option>
                    <option value="prepaga">Prepaga</option>
                    <option value="particular">Particular</option>
                  </select>
                  <label className="form__label">Tipo de cobertura</label>
                  {errors.coverage_type?.message && (
                    <p>{errors.coverage_type.message}</p>
                  )}
                </InputText>
              </article>

              {showCoverageFinanciador && (
                <article>
                  <InputText icono={<v.iconoempresa />}>
                    <select
                      className="form__field"
                      {...register("coverage_financiador_id", {
                        validate: (value) =>
                          !showCoverageFinanciador ||
                          (safeString(value).trim()
                            ? true
                            : "Seleccione un financiador"),
                      })}
                    >
                      <option value="">
                        {loadingCoverageFinanciadores
                          ? "Cargando..."
                          : "Seleccionar"}
                      </option>
                      {coverageFinanciadoresOptions.map((financiador) => (
                        <option key={financiador.id} value={financiador.id}>
                          {financiador.nombre}
                        </option>
                      ))}
                    </select>
                    <label className="form__label">Financiador</label>
                    {errors.coverage_financiador_id?.message && (
                      <p>{errors.coverage_financiador_id.message}</p>
                    )}
                  </InputText>
                </article>
              )}

              {selectedCoverageType === "prepaga" ||
              (selectedCoverageType === "obra_social" &&
                coveragePlanesOptions.length) ? (
                <article>
                  <InputText icono={<v.iconocategorias />}>
                    <select
                      className="form__field"
                      {...register("coverage_plan_id", {
                        validate: (value) =>
                          selectedCoverageType !== "prepaga" ||
                          (safeString(value).trim()
                            ? true
                            : "Seleccione un plan"),
                      })}
                    >
                      <option value="">
                        {loadingCoveragePlanes ? "Cargando..." : "Seleccionar"}
                      </option>
                      {coveragePlanesOptions.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.nombre}
                        </option>
                      ))}
                    </select>
                    <label className="form__label">
                      {selectedCoverageType === "obra_social"
                        ? "Plan (opcional)"
                        : "Plan"}
                    </label>
                    {errors.coverage_plan_id?.message && (
                      <p>{errors.coverage_plan_id.message}</p>
                    )}
                  </InputText>
                </article>
              ) : null}

              {!!selectedCoverageType && (
                <article>
                  <InputText icono={<v.iconoImportante />}>
                    <input
                      className="form__field"
                      type="text"
                      placeholder="Observaciones"
                      {...register("coverage_notes")}
                    />
                    <label className="form__label">Observaciones</label>
                  </InputText>
                </article>
              )}
              {showCoverageFinanciador && (
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
                <article className="full">
                  <InputText icono={<v.iconoImportante />}>
                    <textarea
                      className="form__field"
                      rows={3}
                      placeholder="Motivos de internacion"
                      {...register("admission_reason_notes")}
                    />
                    <label className="form__label">
                      Motivos de internacion
                    </label>
                  </InputText>
                </article>
                <article>
                  <InputText icono={<v.iconoImportante />}>
                    <select
                      className="form__field"
                      {...register("condition_type")}
                    >
                      <option value="agudo">Agudo</option>
                      <option value="cronico">Cronico</option>
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
              </div>
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
              funcion={onClose}
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
