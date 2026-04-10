import styled from "styled-components";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Btn1,
  downloadPacienteIndicacionPdf,
  ModalPacienteIndicacionForm,
  ModalPacienteEvolucionForm,
  ModalPacienteEvolucionesPrintForm,
  ModalPacienteEgresoForm,
  ModalPacienteIngresoForm,
  ModalPacienteEstudioForm,
  exportPacienteEvolucionesDocx,
  PacienteEquipoTratanteTab,
  resolvePerfilDisplayName,
  Spinner1,
  TablaPacienteIndicaciones,
  TablaPacienteEstudios,
  TablaPacienteEvoluciones,
  Title,
  usePacienteClinicalPermissions,
  usePersistedDisclosureState,
  usePermissions,
} from "../../index";
import { PacienteEpicrisisView } from "../organisms/PacienteEpicrisisView";
import {
  getPacienteContactosEmergenciaByPacienteId,
  resolvePacienteContactosEmergenciaByIngreso,
} from "../../supabase/crudContactosEmergencia";
import { getPacienteAntecedentesByPacienteId } from "../../supabase/crudPacientesAntecedentes";
import {
  getPacienteEgresoByIngresoId,
  getPacienteById,
  getPacienteCoberturasByPacienteId,
  getPacienteEquipoTratanteByPacienteId,
  getPacienteIngresoAdminissionTypeHistoryByPacienteId,
  getPacienteEvolucionesByDate,
  getPacienteEvolucionesByRange,
  getPacienteEvolucionesExportContext,
  getPacienteEstudiosByIngresoId,
  getPacienteIndicacionesByIngresoId,
  getPacienteIngresosByPacienteId,
  resolvePacienteCoberturaByDate,
} from "../../supabase/crudPacientes";
import { v } from "../../styles/variables";
import { Device, DeviceMax } from "../../styles/breakpoints";
import {
  clampDateRangeToIngreso,
  getArgentinaDateInputFromValue,
  getIngresoArgentinaDateBounds,
  getArgentinaTodayDateInput,
  shiftArgentinaDateInputByDays,
} from "../../utils/argentinaDateTime";
import {
  PACIENTE_ANTECEDENTES_CLINICO_BOOLEAN_FIELDS,
  PACIENTE_ANTECEDENTES_CLINICO_TEXT_FIELDS,
  PACIENTE_ANTECEDENTES_PERSONAL_FIELDS,
  PACIENTE_ANTECEDENTES_PERSONAL_TEXT_FIELDS,
  PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_BOOLEAN_FIELDS,
  PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_MULTI_FIELDS,
  PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_TEXT_ARRAY_FIELDS,
  hasPacienteAntecedentesContent,
  normalizeAntecedentesTextArray,
} from "../../utils/pacienteAntecedentes";
import { formatPacienteConditionType } from "../../utils/pacienteCondition";
import { downloadPacienteEpicrisisDocx } from "../../utils/pacienteEpicrisisExport";
import { downloadPacienteFichaDocx } from "../../utils/pacienteFichaExport";

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()} ${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
};

const computeAge = (birthDate) => {
  if (!birthDate) return "-";
  const date = new Date(birthDate);
  if (Number.isNaN(date.valueOf())) return "-";
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age -= 1;
  return age >= 0 ? `${age} años` : "-";
};

const formatYesNoBoolean = (value) => {
  if (value === true) return "Si";
  if (value === false) return "No";
  return "-";
};

const formatConditionType = (value) => {
  if (!value) return "-";
  const raw = String(value).trim().toLowerCase();
  if (raw === "agudo") return "Agudo";
  if (raw === "cronico") return "Crónico";
  return value;
};

const formatAdminissionType = (value) => {
  if (!value) return "-";
  const raw = String(value).trim().toLowerCase();
  if (raw === "voluntario") return "Voluntario";
  if (raw === "involuntario") return "Involuntario";
  return String(value).trim() || "-";
};

const formatText = (value) => {
  if (value === null || value === undefined) return "-";
  const text = String(value).trim();
  return text ? text : "-";
};

const formatBooleanLabel = (value) => {
  if (value === true) return "Si"
  if (value === false) return "No";
  return "-";
};

const formatArrayValues = (value) => normalizeAntecedentesTextArray(value);

const formatDocument = (type, number) => {
  const t = formatText(type);
  const n = formatText(number);
  if (t === "-" && n === "-") return "-";
  if (t === "-") return n;
  if (n === "-") return t;
  return `${t} ${n}`;
};

const formatIngresoCreatedBy = (ingreso) => {
  return resolvePerfilDisplayName(ingreso?.creador, ingreso?.created_by);
};
const formatAdminissionTypeHistoryLabel = (row) => {
  const fromType = formatAdminissionType(row?.from_adminission_type);
  const toType = formatAdminissionType(row?.to_adminission_type);
  if (!row?.from_adminission_type) return toType;
  if (fromType === toType) return toType;
  return `${fromType} -> ${toType}`;
};
const formatIngresoDiagnoses = (
  admissionDiagnosis,
  admissionDiagnosisAlternative,
) => {
  const principal = formatText(admissionDiagnosis);
  const secondary = formatText(admissionDiagnosisAlternative);

  if (principal === "-" && secondary === "-") return "-";
  if (secondary === "-") return `Principal: ${principal}`;
  if (principal === "-") return `Secundario: ${secondary}`;
  return `Principal: ${principal} | Secundario: ${secondary}`;
};

const parseAdmissionReasonParts = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return {
      diagnosis: "-",
      additionalNotes: "-",
    };
  }

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const diagnosisLine = lines.find((line) =>
    line.toLowerCase().startsWith("diagnostico:"),
  );
  const notesLine = lines.find((line) =>
    /^(motivos de internacion):/i.test(line),
  );

  return {
    diagnosis: diagnosisLine
      ? diagnosisLine.replace(/^diagnostico:\s*/i, "").trim() || "-"
      : raw,
    additionalNotes: notesLine
      ? notesLine.replace(/^(motivos de internacion):\s*/i, "").trim() || "-"
      : diagnosisLine
        ? "-"
        : raw,
  };
};

const isIngresoActivo = (ingreso) =>
  String(ingreso?.status ?? "").toLowerCase() === "admitted" &&
  !ingreso?.discharge_at;

const getIngresoDurationLabel = (ingreso) => {
  const admission = ingreso?.admission_at
    ? new Date(ingreso.admission_at)
    : null;
  if (!admission || Number.isNaN(admission.valueOf())) return "-";
  const discharge = ingreso?.discharge_at
    ? new Date(ingreso.discharge_at)
    : new Date();
  if (Number.isNaN(discharge.valueOf())) return "-";
  const diffMs = discharge.getTime() - admission.getTime();
  const days = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  return `${days} dia(s)`;
};

const formatDateInputLabel = (value) => {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "-";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

const BASE_TAB_DEFS = [
  { id: "evoluciones", label: "Evoluciones" },
  { id: "indicaciones", label: "Indicaciones" },
  { id: "estudios", label: "Estudios" },
  { id: "equipo", label: "Equipo tratante" },
];
const DEFAULT_EXPANDED_SECTIONS = {
  patientInfo: false,
  antecedentes: false,
  ingresos: true,
  emergencyContacts: false,
};

export function PacienteTemplate({ pacienteId }) {
  const queryClient = useQueryClient();
  const { canCreate, canUpdate } = usePermissions();
  const [activeTab, setActiveTab] = useState("evoluciones");
  const [selectedIngresoId, setSelectedIngresoId] = useState(null);
  const [hasManualIngresoSelection, setHasManualIngresoSelection] =
    useState(false);
  const [openIngresoModal, setOpenIngresoModal] = useState(false);
  const [openEditPacienteModal, setOpenEditPacienteModal] = useState(false);
  const [openEgresoModal, setOpenEgresoModal] = useState(false);
  const [openIndicacionModal, setOpenIndicacionModal] = useState(false);
  const [selectedIndicacionToEdit, setSelectedIndicacionToEdit] = useState(null);
  const [openEstudioModal, setOpenEstudioModal] = useState(false);
  const [selectedEstudioToEdit, setSelectedEstudioToEdit] = useState(null);
  const [openEvolucionModal, setOpenEvolucionModal] = useState(false);
  const [openPrintEvolucionesModal, setOpenPrintEvolucionesModal] =
    useState(false);
  const [selectedEvolucionToEdit, setSelectedEvolucionToEdit] = useState(null);
  const [evolutionViewMode, setEvolutionViewMode] = useState("day");
  const [selectedEvolutionDate, setSelectedEvolutionDate] = useState(
    getArgentinaTodayDateInput(),
  );
  const disclosureStorageKey = useMemo(
    () =>
      pacienteId ? `ui:disclosures:paciente:${pacienteId}` : null,
    [pacienteId],
  );
  const { state: expandedSections, toggle: toggleSection } =
    usePersistedDisclosureState({
      storageKey: disclosureStorageKey,
      defaults: DEFAULT_EXPANDED_SECTIONS,
    });

  const {
    data: paciente,
    isLoading: loadingPaciente,
    error: errorPaciente,
  } = useQuery({
    queryKey: ["pacienteDetalle", pacienteId],
    queryFn: () => getPacienteById(pacienteId),
    enabled: Boolean(pacienteId),
    refetchOnWindowFocus: false,
  });

  const {
    data: coberturas = [],
    isLoading: loadingCoberturas,
    error: errorCoberturas,
  } = useQuery({
    queryKey: ["pacienteCoberturas", pacienteId],
    queryFn: () => getPacienteCoberturasByPacienteId(pacienteId),
    enabled: Boolean(pacienteId),
    refetchOnWindowFocus: false,
  });

  const {
    data: emergencyContacts = [],
    isLoading: loadingEmergencyContacts,
    error: errorEmergencyContacts,
  } = useQuery({
    queryKey: ["pacienteContactosEmergencia", pacienteId],
    queryFn: () => getPacienteContactosEmergenciaByPacienteId(pacienteId),
    enabled: Boolean(pacienteId) && expandedSections.emergencyContacts,
    refetchOnWindowFocus: false,
  });

  const {
    data: antecedentes,
    isLoading: loadingAntecedentes,
    error: errorAntecedentes,
  } = useQuery({
    queryKey: ["pacienteAntecedentes", pacienteId],
    queryFn: () => getPacienteAntecedentesByPacienteId(pacienteId),
    enabled: Boolean(pacienteId) && expandedSections.antecedentes,
    refetchOnWindowFocus: false,
  });

  const {
    data: ingresos = [],
    isLoading: loadingIngresos,
    error: errorIngresos,
  } = useQuery({
    queryKey: ["pacienteIngresos", pacienteId],
    queryFn: () => getPacienteIngresosByPacienteId(pacienteId),
    enabled: Boolean(pacienteId),
    refetchOnWindowFocus: false,
    onSuccess: (rows) => {
      if (!rows?.length) {
        setSelectedIngresoId(null);
        setHasManualIngresoSelection(false);
        return;
      }

      const selectionExists = rows.some(
        (ingreso) => String(ingreso.id) === String(selectedIngresoId),
      );
      if (hasManualIngresoSelection && selectionExists) return;

      if (hasManualIngresoSelection && !selectionExists) {
        setHasManualIngresoSelection(false);
      }

      const currentActiveIngreso =
        rows.find((ingreso) => isIngresoActivo(ingreso)) ?? null;
      setSelectedIngresoId(currentActiveIngreso?.id ?? null);
    },
  });
  const {
    data: adminissionTypeHistory = [],
  } = useQuery({
    queryKey: ["pacienteIngresoAdminissionTypeHistory", pacienteId],
    queryFn: () => getPacienteIngresoAdminissionTypeHistoryByPacienteId(pacienteId),
    enabled: Boolean(pacienteId),
    refetchOnWindowFocus: false,
  });

  const activeIngreso = useMemo(
    () => (ingresos ?? []).find((ingreso) => isIngresoActivo(ingreso)) ?? null,
    [ingresos],
  );
  const adminissionTypeHistoryByIngreso = useMemo(() => {
    return (adminissionTypeHistory ?? []).reduce((acc, row) => {
      const ingresoId = String(row?.ingreso_id ?? "");
      if (!ingresoId) return acc;
      if (!acc[ingresoId]) acc[ingresoId] = [];
      acc[ingresoId].push(row);
      return acc;
    }, {});
  }, [adminissionTypeHistory]);

  useEffect(() => {
    if (hasManualIngresoSelection) return;
    setSelectedIngresoId(activeIngreso?.id ?? null);
  }, [activeIngreso?.id, hasManualIngresoSelection]);

  const selectedIngreso = useMemo(
    () =>
      (ingresos ?? []).find(
        (ingreso) => String(ingreso.id) === String(selectedIngresoId),
      ) ?? null,
    [ingresos, selectedIngresoId],
  );
  const isIngresosExpanded = true;
  const evolutionIngresoContext = selectedIngreso ?? activeIngreso ?? null;
  const evolutionIngresoId = evolutionIngresoContext?.id ?? null;
  const evolutionPeriodBounds = useMemo(
    () => getIngresoArgentinaDateBounds(evolutionIngresoContext),
    [evolutionIngresoContext],
  );
  const effectiveSelectedEvolutionDate = useMemo(() => {
    if (!selectedEvolutionDate) return selectedEvolutionDate;
    if (!evolutionPeriodBounds.fromDate || !evolutionPeriodBounds.toDate) {
      return selectedEvolutionDate;
    }
    if (selectedEvolutionDate < evolutionPeriodBounds.fromDate) {
      return evolutionPeriodBounds.fromDate;
    }
    if (selectedEvolutionDate > evolutionPeriodBounds.toDate) {
      return evolutionPeriodBounds.toDate;
    }
    return selectedEvolutionDate;
  }, [
    evolutionPeriodBounds.fromDate,
    evolutionPeriodBounds.toDate,
    selectedEvolutionDate,
  ]);

  const {
    data: equipo = [],
    isLoading: loadingEquipo,
    error: errorEquipo,
  } = useQuery({
    queryKey: ["pacienteEquipo", pacienteId],
    queryFn: () => getPacienteEquipoTratanteByPacienteId(pacienteId),
    enabled:
      Boolean(pacienteId) &&
      ["equipo", "evoluciones", "indicaciones", "estudios"].includes(activeTab),
    refetchOnWindowFocus: false,
  });

  const {
    data: evoluciones = [],
    isLoading: loadingEvoluciones,
    error: errorEvoluciones,
  } = useQuery({
    queryKey: [
      "pacienteEvoluciones",
      pacienteId,
      evolutionIngresoId,
      evolutionViewMode,
      effectiveSelectedEvolutionDate,
      evolutionPeriodBounds.fromDate,
      evolutionPeriodBounds.toDate,
    ],
    queryFn: () => {
      if (evolutionViewMode === "period") {
        return getPacienteEvolucionesByRange({
          pacienteId,
          ingresoId: evolutionIngresoId,
          fromDate: evolutionPeriodBounds.fromDate,
          toDate: evolutionPeriodBounds.toDate,
        });
      }

      return getPacienteEvolucionesByDate({
        pacienteId,
        ingresoId: evolutionIngresoId,
        date: effectiveSelectedEvolutionDate,
      });
    },
    enabled:
      Boolean(pacienteId) &&
      Boolean(evolutionIngresoId) &&
      Boolean(
        evolutionViewMode === "period"
          ? evolutionPeriodBounds.fromDate && evolutionPeriodBounds.toDate
          : effectiveSelectedEvolutionDate,
      ) &&
      activeTab === "evoluciones",
    refetchOnWindowFocus: false,
  });

  const {
    data: indicaciones = [],
    isLoading: loadingIndicaciones,
    error: errorIndicaciones,
  } = useQuery({
    queryKey: ["pacienteIndicaciones", pacienteId, selectedIngresoId],
    queryFn: () => getPacienteIndicacionesByIngresoId(selectedIngresoId),
    enabled: Boolean(selectedIngresoId) && activeTab === "indicaciones",
    refetchOnWindowFocus: false,
  });

  const {
    data: estudios = [],
    isLoading: loadingEstudios,
    error: errorEstudios,
  } = useQuery({
    queryKey: ["pacienteEstudios", selectedIngresoId],
    queryFn: () => getPacienteEstudiosByIngresoId(selectedIngresoId),
    enabled: Boolean(selectedIngresoId) && activeTab === "estudios",
    refetchOnWindowFocus: false,
  });

  const epicrisisIngresoContext = useMemo(() => {
    if (!selectedIngreso || isIngresoActivo(selectedIngreso)) return null;
    return selectedIngreso;
  }, [selectedIngreso]);

  const epicrisisIngresoId = epicrisisIngresoContext?.id ?? null;
  const {
    data: epicrisis = null,
    isLoading: loadingEpicrisis,
    error: errorEpicrisis,
  } = useQuery({
    queryKey: ["pacienteEgreso", epicrisisIngresoId],
    queryFn: () => getPacienteEgresoByIngresoId(epicrisisIngresoId),
    enabled: Boolean(epicrisisIngresoId) && activeTab === "epicrisis",
    refetchOnWindowFocus: false,
  });

  const episodeEditable = Boolean(
    selectedIngreso && isIngresoActivo(selectedIngreso),
  );
  const showEpicrisisTab = !activeIngreso || Boolean(epicrisisIngresoContext);
  const availableTabs = useMemo(
    () =>
      showEpicrisisTab
        ? [...BASE_TAB_DEFS, { id: "epicrisis", label: "Epicrisis" }]
        : BASE_TAB_DEFS,
    [showEpicrisisTab],
  );

  useEffect(() => {
    if (availableTabs.some((tab) => tab.id === activeTab)) return;
    setActiveTab("evoluciones");
  }, [activeTab, availableTabs]);

  const canCloseActiveIngreso =
    Boolean(activeIngreso) && canUpdate("pacientes");
  const canOpenIngreso = canCreate("pacientes");
  const selectedIngresoAllowsEdit =
    !selectedIngreso || isIngresoActivo(selectedIngreso);
  const canEditPatient =
    canUpdate("pacientes") &&
    Boolean(activeIngreso) &&
    paciente?.is_active !== false &&
    selectedIngresoAllowsEdit;
  const todayEvolutionDate = getArgentinaTodayDateInput();
  const evolutionMaxDate =
    evolutionPeriodBounds.toDate && evolutionPeriodBounds.toDate < todayEvolutionDate
      ? evolutionPeriodBounds.toDate
      : todayEvolutionDate;
  const isEvolutionPrevDisabled =
    Boolean(evolutionPeriodBounds.fromDate) &&
    effectiveSelectedEvolutionDate <= evolutionPeriodBounds.fromDate;
  const isEvolutionNextDisabled =
    Boolean(evolutionMaxDate) &&
    effectiveSelectedEvolutionDate >= evolutionMaxDate;
  const {
    canManageTeam,
    canCreateEvolution,
    canEditEvolution,
    canCreateIndicacion,
    canEditIndicacion,
    canCreateEstudio,
    canEditEstudio,
  } = usePacienteClinicalPermissions({
    equipo,
    selectedIngreso,
    evolutionIngreso: evolutionIngresoContext,
  });
  const indicacionesQueryKey = ["pacienteIndicaciones", pacienteId, selectedIngresoId];
  const selectedIndicacionRecord = indicaciones?.[0] ?? null;
  const canCreateIndicacionAction =
    canCreateIndicacion && !loadingIndicaciones && !indicaciones.length;
  const canPrintIndicacion =
    Boolean(selectedIngresoId) && Boolean(selectedIndicacionRecord);
  const estudiosQueryKey = ["pacienteEstudios", selectedIngresoId];
  const canPrintEvolutions = Boolean(evolutionIngresoId);
  const canDownloadEpicrisis =
    Boolean(epicrisisIngresoId) && Boolean(epicrisis);
  const showIngresoSummaryInPatientInfo =
    Boolean(activeIngreso) ||
    (hasManualIngresoSelection && Boolean(selectedIngreso));
  const ingresoContext = selectedIngreso ?? activeIngreso ?? null;
  const admissionReasonDetails = useMemo(
    () => parseAdmissionReasonParts(ingresoContext?.admission_reason),
    [ingresoContext?.admission_reason],
  );
  const admissionAdditionalNotesLabel = useMemo(() => {
    const raw = String(ingresoContext?.admission_reason ?? "").trim();

    if (!raw) return "-";
    if (
      raw.toLowerCase().startsWith("diagnostico:") ||
      /(?:motivos de internacion):/i.test(raw)
    ) {
      return admissionReasonDetails.additionalNotes;
    }
    return raw;
  }, [admissionReasonDetails.additionalNotes, ingresoContext?.admission_reason]);

  const coverageReferenceDate =
    selectedIngreso?.admission_at ??
    activeIngreso?.admission_at ??
    coberturas?.[0]?.start_date ??
    null;
  const epicrisisCoverageReferenceDate =
    epicrisisIngresoContext?.discharge_at ??
    epicrisisIngresoContext?.admission_at ??
    coverageReferenceDate;
  const ingresoModalSucursalId =
    selectedIngreso?.sucursal_id ??
    activeIngreso?.sucursal_id ??
    ingresos?.[0]?.sucursal_id ??
    null;
  const emergencyContactsByIngreso = useMemo(
    () =>
      resolvePacienteContactosEmergenciaByIngreso(
        emergencyContacts,
        ingresoContext,
      ),
    [emergencyContacts, ingresoContext],
  );
  const hasAntecedentesContent = useMemo(
    () => hasPacienteAntecedentesContent(antecedentes),
    [antecedentes],
  );
  const coberturaSeleccionada = useMemo(() => {
    if (!coberturas?.length) return null;
    if (!coverageReferenceDate) return coberturas[0] ?? null;
    return (
      resolvePacienteCoberturaByDate(coberturas, coverageReferenceDate) ??
      coberturas[0] ??
      null
    );
  }, [coberturas, coverageReferenceDate]);
  const epicrisisCobertura = useMemo(() => {
    if (!coberturas?.length) return null;
    if (!epicrisisCoverageReferenceDate) return coberturas[0] ?? null;
    return (
      resolvePacienteCoberturaByDate(coberturas, epicrisisCoverageReferenceDate) ??
      coberturas[0] ??
      null
    );
  }, [coberturas, epicrisisCoverageReferenceDate]);

  const loading = loadingPaciente || loadingIngresos;
  const error = errorPaciente || errorIngresos;

  const tabLoading =
    (activeTab === "evoluciones" && loadingEvoluciones) ||
    (activeTab === "indicaciones" && loadingIndicaciones) ||
    (activeTab === "estudios" && loadingEstudios) ||
    (activeTab === "equipo" && loadingEquipo) ||
    (activeTab === "epicrisis" && loadingEpicrisis);

  const tabError =
    (activeTab === "evoluciones" && errorEvoluciones) ||
    (activeTab === "indicaciones" && errorIndicaciones) ||
    (activeTab === "estudios" && errorEstudios) ||
    (activeTab === "equipo" && errorEquipo) ||
    (activeTab === "epicrisis" && errorEpicrisis) ||
    null;

  if (loading) return <Spinner1 />;
  if (error) return <span>ha ocurrido un error: {error.message}</span>;
  if (!paciente) return <span>Paciente no encontrado.</span>;

  const patientName =
    `${paciente.first_name ?? ""} ${paciente.last_name ?? ""}`.trim();
  const patientDoc = formatDocument(
    paciente.document_type,
    paciente.document_number,
  );
  const patientAge = computeAge(paciente.birthday);
  const patientCondition = formatPacienteConditionType(
    activeIngreso?.condition_type ?? paciente.condition_type
  );
  const patientStatus = activeIngreso ? "Internado" : "Egresado";
  const patientAdminissionType = formatAdminissionType(
    ingresoContext?.adminission_type,
  );
  const evolutionModePeriodLabel =
    evolutionPeriodBounds.fromDate && evolutionPeriodBounds.toDate
      ? `${formatDateInputLabel(evolutionPeriodBounds.fromDate)} - ${formatDateInputLabel(
          evolutionPeriodBounds.toDate,
        )}`
      : "-";
  const evolutionEmptyStateLabel =
    evolutionViewMode === "period"
      ? "Sin evoluciones para el periodo de internacion seleccionado."
      : "Sin evoluciones para la fecha seleccionada.";
  const evolutionDateRestriction = selectedEvolucionToEdit?.evolution_at
    ? getArgentinaDateInputFromValue(selectedEvolucionToEdit.evolution_at)
    : evolutionViewMode === "period"
      ? todayEvolutionDate
      : effectiveSelectedEvolutionDate;
  const evolutionQueryKey = [
    "pacienteEvoluciones",
    pacienteId,
    evolutionIngresoId,
    evolutionViewMode,
    effectiveSelectedEvolutionDate,
    evolutionPeriodBounds.fromDate,
    evolutionPeriodBounds.toDate,
  ];

  const handlePrintEvoluciones = async ({ fromDate, toDate }) => {
    const clampedRange = clampDateRangeToIngreso({
      fromDate,
      toDate,
      ingreso: evolutionIngresoContext,
    });

    if (
      clampedRange.wasClamped ||
      clampedRange.fromDate !== fromDate ||
      clampedRange.toDate !== toDate
    ) {
      throw new Error(
        "El rango debe estar dentro del periodo de internacion seleccionado.",
      );
    }

    const exportContext = await getPacienteEvolucionesExportContext({
      pacienteId,
      ingresoId: evolutionIngresoId,
      fromDate,
      toDate,
    });

    await exportPacienteEvolucionesDocx(exportContext);

    Swal.fire({
      icon: "success",
      title: "Documento generado",
      text: "Las evoluciones fueron exportadas correctamente.",
    });
  };

  const handleDownloadIndicacionPdf = () => {
    if (!selectedIndicacionRecord) {
      Swal.fire({
        icon: "info",
        title: "Sin indicaciones",
        text: "No hay una hoja de indicaciones disponible para descargar.",
      });
      return;
    }

    try {
      downloadPacienteIndicacionPdf({
        paciente,
        ingreso: selectedIngreso ?? activeIngreso ?? null,
        indicacion: selectedIndicacionRecord,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text:
          error?.message ||
          "No se pudo descargar el PDF de la hoja de indicaciones.",
      });
    }
  };

  const handleDownloadEpicrisisWord = async () => {
    if (!epicrisisIngresoContext?.id) {
      Swal.fire({
        icon: "info",
        title: "Sin internacion",
        text: "Seleccione una internacion cerrada para descargar la epicrisis.",
      });
      return;
    }

    if (!epicrisis) {
      Swal.fire({
        icon: "info",
        title: "Sin epicrisis",
        text: "No hay una epicrisis registrada para esta internacion.",
      });
      return;
    }

    try {
      await downloadPacienteEpicrisisDocx({
        paciente,
        ingreso: epicrisisIngresoContext,
        epicrisis,
        cobertura: epicrisisCobertura,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error?.message || "No se pudo descargar el documento de epicrisis.",
      });
    }
  };

  const handlePrintPacienteInfo = async () => {
    try {
      Swal.fire({
        title: "Generando documento",
        text: "Estamos preparando la ficha del paciente.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const [antecedentesDoc, emergencyContactsDoc] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: ["pacienteAntecedentes", pacienteId],
          queryFn: () => getPacienteAntecedentesByPacienteId(pacienteId),
        }),
        queryClient.fetchQuery({
          queryKey: ["pacienteContactosEmergencia", pacienteId],
          queryFn: () => getPacienteContactosEmergenciaByPacienteId(pacienteId),
        }),
      ]);

      const emergencyContactsForIngreso = resolvePacienteContactosEmergenciaByIngreso(
        emergencyContactsDoc,
        ingresoContext,
      );

      await downloadPacienteFichaDocx({
        paciente,
        ingreso: ingresoContext,
        cobertura: coberturaSeleccionada,
        antecedentes: antecedentesDoc,
        emergencyContacts: emergencyContactsForIngreso,
      });

      Swal.fire({
        icon: "success",
        title: "Documento generado",
        text: "La ficha del paciente fue exportada correctamente.",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text:
          error?.message ||
          "No se pudo generar la ficha del paciente.",
      });
    }
  };

  return (
    <Container>
      <Header>
        <div className="titleGroup">
          <Title>Paciente</Title>
          <h2>{patientName || "Sin nombre"}</h2>

          <div className="summaryRow">
            <div className="badges">
              <StatusTag className={activeIngreso ? "active" : "closed"}>
                {patientStatus}
              </StatusTag>
              <StatusTag>{patientCondition}</StatusTag>
              {showIngresoSummaryInPatientInfo ? (
                <StatusTag>{patientAdminissionType}</StatusTag>
              ) : null}
              {!showIngresoSummaryInPatientInfo ? (
                <HeaderWarning>
                  Para ver mas informacion, seleccione una opcion en el
                  historial de ingresos.
                </HeaderWarning>
              ) : null}
            </div>
            <div className="ctaGroup">
              {!activeIngreso && canOpenIngreso && (
                <Btn1
                  icono={<v.iconoagregar />}
                  titulo="Ingresar"
                  bgcolor={v.colorPrincipal}
                  funcion={() => setOpenIngresoModal(true)}
                />
              )}
              {activeIngreso && canCloseActiveIngreso && (
                <Btn1
                  icono={<v.iconocerrar />}
                  titulo="Alta Sanatorial"
                  bgcolor="var(--color-danger-action)"
                  funcion={() => setOpenEgresoModal(true)}
                />
              )}
            </div>
          </div>
        </div>
      </Header>

      <TimelineCard className={isIngresosExpanded ? "" : "collapsed"}>
        <SectionToggle as="div" aria-expanded={isIngresosExpanded}>
          <div>
            <span className="title">Historial de ingresos</span>
            <small>
              {ingresos.length
                ? `${ingresos.length} registro(s)`
                : "Sin registros"}
            </small>
          </div>
        </SectionToggle>
        {isIngresosExpanded &&
          (ingresos.length ? (
            <div className="timelineList">
              <div className="timelineHead" aria-hidden="true">
                <span>Fecha de ingreso</span>
                <span>Fecha de egreso</span>
                <span>Tipo de internacion</span>
                <span>Sucursal</span>
                <span>Ingresado por</span>
                <span>Diagnostico</span>
                <span>Cantidad de dias</span>
                <span>Estado</span>
              </div>
              {ingresos.map((ingreso) => {
                const ingresoHistory =
                  adminissionTypeHistoryByIngreso[String(ingreso.id)] ?? [];

                return (
                  <div key={ingreso.id} className="timelineEntry">
                    <button
                      type="button"
                      className={`timelineItem ${
                        String(ingreso.id) === String(selectedIngresoId)
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        setHasManualIngresoSelection(true);
                        setSelectedIngresoId(ingreso.id);
                      }}
                    >
                      <span data-label="Fecha de ingreso">
                        {formatDateTime(ingreso.admission_at)}
                      </span>
                      <span data-label="Fecha de egreso">
                        {formatDateTime(ingreso.discharge_at)}
                      </span>
                      <span data-label="Tipo de internacion">
                        {formatAdminissionType(ingreso.adminission_type)}
                      </span>
                      <span data-label="Sucursal">
                        {ingreso?.sucursal?.name ?? "-"}
                      </span>
                      <span data-label="Ingresado por">
                        {formatIngresoCreatedBy(ingreso)}
                      </span>
                      <span className="diagnosis" data-label="Diagnostico">
                        {formatIngresoDiagnoses(
                          ingreso.admission_diagnosis,
                          ingreso.admission_diagnosis_alternative,
                        )}
                      </span>
                      <span data-label="Cantidad de dias">
                        {getIngresoDurationLabel(ingreso)}
                      </span>
                      <span
                        className={`status ${isIngresoActivo(ingreso) ? "active" : "closed"}`}
                        data-label="Estado"
                      >
                        {isIngresoActivo(ingreso) ? "Activo" : "Cerrado"}
                      </span>
                    </button>
                    {ingresoHistory.length ? (
                      <div className="timelineChanges">
                        <span className="changesTitle">
                          Cambios de tipo de internacion
                        </span>
                        <div className="changesList">
                          {ingresoHistory.map((row) => (
                            <div
                              key={`${ingreso.id}-${row.id}`}
                              className="changeItem"
                            >
                              <strong>{formatDateTime(row.changed_at)}</strong>
                              <span>{formatAdminissionTypeHistoryLabel(row)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState>Sin ingresos registrados.</EmptyState>
          ))}
      </TimelineCard>

      <InfoCard className={expandedSections.patientInfo ? "" : "collapsed"}>
        <CardHeaderRow>
          <CardHeaderTitleButton
            type="button"
            onClick={() => toggleSection("patientInfo")}
            aria-expanded={expandedSections.patientInfo}
          >
            <span className="title">Informacion del paciente</span>
             <small>
              Datos del paciente y su ingreso actual (si tiene). Para editar la informacion del paciente, utilice el boton de editar. Para ver la informacion relacionada a otro ingreso, seleccione el ingreso deseado en el historial de ingresos.
            </small>
          </CardHeaderTitleButton>
          <CardHeaderActions>
            <CardActionButton
              type="button"
              onClick={handlePrintPacienteInfo}
            >
              <v.iconoWord />
              <span>Imprimir</span>
            </CardActionButton>
            {canEditPatient && (
              <CardActionButton
                type="button"
                onClick={() => setOpenEditPacienteModal(true)}
              >
                <v.iconeditarTabla />
                <span>Editar</span>
              </CardActionButton>
            )}
            <SectionInlineToggle
              type="button"
              onClick={() => toggleSection("patientInfo")}
              aria-expanded={expandedSections.patientInfo}
              className={expandedSections.patientInfo ? "expanded" : ""}
            >
              <span className="chevronLabel">
                {expandedSections.patientInfo ? "Ver menos" : "Ver mas"}
              </span>
              <span className="chevronIcon">
                <v.iconoFlechabajo />
              </span>
            </SectionInlineToggle>
          </CardHeaderActions>
        </CardHeaderRow>
        {expandedSections.patientInfo && (
          <InfoGrid>
            {showIngresoSummaryInPatientInfo ? (
              <InfoItem>
                <span className="label">Condición</span>
                <span className="value">
                  {formatPacienteConditionType(
                    ingresoContext?.condition_type ?? paciente.condition_type
                  )}
                </span>
              </InfoItem>
            ) : null}
            {showIngresoSummaryInPatientInfo ? (
              <InfoItem>
                <span className="label">Fecha de ingreso</span>
                <span className="value">
                  {formatDateTime(ingresoContext?.admission_at)}
                </span>
              </InfoItem>
            ) : null}
            {showIngresoSummaryInPatientInfo &&
            ingresoContext?.discharge_at &&
            !isIngresoActivo(ingresoContext) ? (
              <InfoItem>
                <span className="label">Fecha de egreso</span>
                <span className="value">
                  {formatDateTime(ingresoContext?.discharge_at)}
                </span>
              </InfoItem>
            ) : null}
            {showIngresoSummaryInPatientInfo ? (
              <InfoItem>
                <span className="label">Tipo de internacion</span>
                <span className="value">
                  {formatAdminissionType(ingresoContext?.adminission_type)}
                </span>
              </InfoItem>
            ) : null}
            {showIngresoSummaryInPatientInfo ? (
              <InfoItem>
                <span className="label">Motivos de internacion</span>
                <span className="value">
                  {formatText(admissionAdditionalNotesLabel)}
                </span>
              </InfoItem>
            ) : null}
            {showIngresoSummaryInPatientInfo ? (
              <InfoItem>
                <span className="label">Diagnostico principal</span>
                <span className="value">
                  {formatText(ingresoContext?.admission_diagnosis)}
                </span>
              </InfoItem>
            ) : null}
            {showIngresoSummaryInPatientInfo ? (
              <InfoItem>
                <span className="label">Diagnostico secundario</span>
                <span className="value">
                  {formatText(
                    ingresoContext?.admission_diagnosis_alternative,
                  )}
                </span>
              </InfoItem>
            ) : null}

            <InfoItem>
              <span className="label">Cobertura</span>
              <span className="value">
                {errorCoberturas
                  ? "No disponible"
                  : (coberturaSeleccionada?.coverage ??
                    (loadingCoberturas ? "Cargando..." : "-"))}
              </span>
            </InfoItem>
            <InfoItem>
              <span className="label">Detalle de cobertura</span>
              <span className="value">
                {errorCoberturas
                  ? "No disponible"
                  : (coberturaSeleccionada?.coverage_notes ??
                    (loadingCoberturas ? "Cargando..." : "-"))}
              </span>
            </InfoItem>
            <InfoItem>
              <span className="label">Documento</span>
              <span className="value">{patientDoc}</span>
            </InfoItem>
            <InfoItem>
              <span className="label">Fecha de nacimiento</span>
              <span className="value">{formatDate(paciente.birthday)}</span>
            </InfoItem>
            <InfoItem>
              <span className="label">Edad</span>
              <span className="value">{patientAge}</span>
            </InfoItem>
            <InfoItem>
              <span className="label">Género</span>
              <span className="value">{formatText(paciente.genre)}</span>
            </InfoItem>
            <InfoItem>
              <span className="label">Teléfono</span>
              <span className="value">{formatText(paciente.telephone)}</span>
            </InfoItem>
            <InfoItem>
              <span className="label">Email</span>
              <span className="value">{formatText(paciente.email)}</span>
            </InfoItem>
            <InfoItem>
              <span className="label">Dirección</span>
              <span className="value">{formatText(paciente.address)}</span>
            </InfoItem>

            <InfoItem>
              <span className="label">Localidad</span>
              <span className="value">{formatText(paciente.localidad)}</span>
            </InfoItem>
            <InfoItem>
              <span className="label">Estado civil</span>
              <span className="value">{formatText(paciente.estado_civil)}</span>
            </InfoItem>
            <InfoItem>
              <span className="label">Convivencia</span>
              <span className="value">{formatText(paciente.convivencia)}</span>
            </InfoItem>
            <InfoItem>
              <span className="label">Educación</span>
              <span className="value">{formatText(paciente.educacion)}</span>
            </InfoItem>
            <InfoItem>
              <span className="label">Sabe leer y escribir</span>
              <span className="value">
                {formatYesNoBoolean(paciente.alfabetizado)}
              </span>
            </InfoItem>
            <InfoItem>
              <span className="label">Ocupación</span>
              <span className="value">{formatText(paciente.ocupacion)}</span>
            </InfoItem>
            <InfoItem>
              <span className="label">Religión</span>
              <span className="value">{formatText(paciente.religion)}</span>
            </InfoItem>
            <InfoItem>
              <span className="label">Lugar de nacimiento</span>
              <span className="value">
                {formatText(paciente.lugar_nacimiento)}
              </span>
            </InfoItem>
            <InfoItem>
              <span className="label">Cantidad de hijos</span>
              <span className="value">
                {paciente.hijos === null || paciente.hijos === undefined
                  ? "-"
                  : paciente.hijos}
              </span>
            </InfoItem>
          </InfoGrid>
        )}
      </InfoCard>

      <InfoCard className={expandedSections.antecedentes ? "" : "collapsed"}>
        <SectionToggle
          type="button"
          onClick={() => toggleSection("antecedentes")}
          aria-expanded={expandedSections.antecedentes}
        >
          <div>
            <span className="title">Antecedentes</span>
            <small>
              Antecedentes personales, clínicos y examen psicopatológico
            </small>
          </div>
          <span
            className={`chevron ${expandedSections.antecedentes ? "expanded" : ""}`}
          >
            <span className="chevronLabel">
              {expandedSections.antecedentes ? "Ver menos" : "Ver mas"}
            </span>
            <span className="chevronIcon">
              <v.iconoFlechabajo />
            </span>
          </span>
        </SectionToggle>
        {expandedSections.antecedentes && (
          <>
            {loadingAntecedentes ? <Spinner1 /> : null}
            {errorAntecedentes ? (
              <EmptyState>No se pudieron cargar los antecedentes.</EmptyState>
            ) : null}
            {!loadingAntecedentes &&
            !errorAntecedentes &&
            !hasAntecedentesContent ? (
              <EmptyState>Sin antecedentes cargados.</EmptyState>
            ) : null}
            {!loadingAntecedentes &&
            !errorAntecedentes &&
            hasAntecedentesContent ? (
              <AntecedentesLayout>
                <AntecedentesGroup>
                  <div className="groupHeader">
                    <h4>Antecedentes personales</h4>
                    <small>
                      Desarrollo, tratamientos previos y antecedentes familiares
                    </small>
                  </div>
                  <AntecedentesGrid>
                    {PACIENTE_ANTECEDENTES_PERSONAL_FIELDS.map((field) => (
                      <InfoItem key={field.name}>
                        <span className="label">{field.label}</span>
                        <span className="value">
                          {formatBooleanLabel(antecedentes?.[field.name])}
                        </span>
                      </InfoItem>
                    ))}
                    {PACIENTE_ANTECEDENTES_PERSONAL_TEXT_FIELDS.map((field) => (
                      <InfoItem key={field.name} className="full">
                        <span className="label">{field.label}</span>
                        <span className="value">
                          {formatText(antecedentes?.[field.name])}
                        </span>
                      </InfoItem>
                    ))}
                  </AntecedentesGrid>
                </AntecedentesGroup>

                <AntecedentesGroup>
                  <div className="groupHeader">
                    <h4>Antecedentes clínicos</h4>
                    <small>Patologías, consumo y observaciones médicas</small>
                  </div>
                  <AntecedentesGrid>
                    {PACIENTE_ANTECEDENTES_CLINICO_BOOLEAN_FIELDS.map(
                      (field) => (
                        <InfoItem key={field.name}>
                          <span className="label">{field.label}</span>
                          <span className="value">
                            {formatBooleanLabel(antecedentes?.[field.name])}
                          </span>
                        </InfoItem>
                      ),
                    )}
                    {PACIENTE_ANTECEDENTES_CLINICO_TEXT_FIELDS.map((field) => (
                      <InfoItem key={field.name} className="full">
                        <span className="label">{field.label}</span>
                        <span className="value">
                          {formatText(antecedentes?.[field.name])}
                        </span>
                      </InfoItem>
                    ))}
                  </AntecedentesGrid>
                </AntecedentesGroup>

                <AntecedentesGroup>
                  <div className="groupHeader">
                    <h4>Examen psicopatológico</h4>
                    <small>
                      Indicadores clínicos, percepción, juicio y medicación
                    </small>
                  </div>
                  <AntecedentesGrid>
                    {PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_MULTI_FIELDS.map(
                      (field) => (
                        <InfoItem key={field.name} className="full">
                          <span className="label">{field.label}</span>
                          {formatArrayValues(antecedentes?.[field.name])
                            .length ? (
                            <ArrayPills>
                              {formatArrayValues(
                                antecedentes?.[field.name],
                              ).map((value) => (
                                <span key={`${field.name}-${value}`}>
                                  {value}
                                </span>
                              ))}
                            </ArrayPills>
                          ) : (
                            <span className="value">-</span>
                          )}
                        </InfoItem>
                      ),
                    )}
                    {PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_BOOLEAN_FIELDS.map(
                      (field) => (
                        <InfoItem key={field.name}>
                          <span className="label">{field.label}</span>
                          <span className="value">
                            {formatBooleanLabel(antecedentes?.[field.name])}
                          </span>
                        </InfoItem>
                      ),
                    )}
                    {PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_TEXT_ARRAY_FIELDS.map(
                      (field) => (
                        <InfoItem key={field.name} className="full">
                          <span className="label">{field.label}</span>
                          {formatArrayValues(antecedentes?.[field.name])
                            .length ? (
                            <ArrayPills>
                              {formatArrayValues(
                                antecedentes?.[field.name],
                              ).map((value) => (
                                <span key={`${field.name}-${value}`}>
                                  {value}
                                </span>
                              ))}
                            </ArrayPills>
                          ) : (
                            <span className="value">-</span>
                          )}
                        </InfoItem>
                      ),
                    )}
                  </AntecedentesGrid>
                </AntecedentesGroup>
              </AntecedentesLayout>
            ) : null}
          </>
        )}
      </InfoCard>

      {showIngresoSummaryInPatientInfo ? (
        <InfoCard
          className={expandedSections.emergencyContacts ? "" : "collapsed"}
        >
          <SectionToggle
            type="button"
            onClick={() => toggleSection("emergencyContacts")}
            aria-expanded={expandedSections.emergencyContacts}
          >
            <div>
              <span className="title">Contactos de emergencia</span>
              <small>
                {ingresoContext
                  ? `Asociados a la internacion del día ${formatDate(ingresoContext.admission_at)}`
                  : "Seleccione una internacion para ver los contactos"}
              </small>
            </div>
            <span
              className={`chevron ${
                expandedSections.emergencyContacts ? "expanded" : ""
              }`}
            >
              <span className="chevronLabel">
                {expandedSections.emergencyContacts ? "Ver menos" : "Ver mas"}
              </span>
              <span className="chevronIcon">
                <v.iconoFlechabajo />
              </span>
            </span>
          </SectionToggle>
          {expandedSections.emergencyContacts && (
            <>
              {loadingEmergencyContacts ? <Spinner1 /> : null}
              {errorEmergencyContacts ? (
                <EmptyState>No se pudieron cargar los contactos.</EmptyState>
              ) : null}
              {!loadingEmergencyContacts &&
              !errorEmergencyContacts &&
              !ingresoContext ? (
                <EmptyState>Sin internacion seleccionada.</EmptyState>
              ) : null}
              {!loadingEmergencyContacts &&
              !errorEmergencyContacts &&
              ingresoContext &&
              !emergencyContactsByIngreso.length ? (
                <EmptyState>
                  Sin contactos cargados para esta internacion.
                </EmptyState>
              ) : null}
              {!loadingEmergencyContacts &&
              !errorEmergencyContacts &&
              emergencyContactsByIngreso.length ? (
                <ContactTable>
                  <div className="contactHead" aria-hidden="true">
                    <span>Parentesco</span>
                    <span>Nombre</span>
                    <span>Telefono</span>
                    <span>Documento</span>
                  </div>
                  {emergencyContactsByIngreso.map((contact) => (
                    <div key={contact.id} className="contactRow">
                      <span data-label="Parentesco">
                        {formatText(contact.vinculo)}
                      </span>
                      <span data-label="Nombre">
                        {formatText(contact.name)}
                      </span>
                      <span data-label="Telefono">
                        {formatText(contact.telephone)}
                      </span>
                      <span data-label="Documento">
                        {formatDocument(contact.doc_type, contact.doc_number)}
                      </span>
                    </div>
                  ))}
                </ContactTable>
              ) : null}
            </>
          )}
        </InfoCard>
      ) : null}

      <Tabs>
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </Tabs>

      {activeTab === "evoluciones" ? (
        <TabControls>
          <div className="filtersGroup evolutionFilters">
            <div className="modeSwitch" role="tablist" aria-label="Vista de evoluciones">
              <button
                type="button"
                role="tab"
                aria-selected={evolutionViewMode === "day"}
                className={evolutionViewMode === "day" ? "active" : ""}
                onClick={() => setEvolutionViewMode("day")}
              >
                Dia
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={evolutionViewMode === "period"}
                className={evolutionViewMode === "period" ? "active" : ""}
                onClick={() => setEvolutionViewMode("period")}
                disabled={!evolutionIngresoId}
              >
                Periodo
              </button>
            </div>

            {evolutionViewMode === "day" ? (
              <div className="dateFilter">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedEvolutionDate((prev) =>
                      shiftArgentinaDateInputByDays(
                        effectiveSelectedEvolutionDate || prev,
                        -1,
                      ),
                    )
                  }
                  aria-label="Dia anterior"
                  disabled={isEvolutionPrevDisabled}
                >
                  <v.iconoflechaizquierda />
                </button>
                <input
                  type="date"
                  value={effectiveSelectedEvolutionDate}
                  min={evolutionPeriodBounds.fromDate ?? undefined}
                  max={evolutionMaxDate}
                  onChange={(event) =>
                    event.target.value &&
                    setSelectedEvolutionDate(event.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setSelectedEvolutionDate((prev) =>
                      shiftArgentinaDateInputByDays(
                        effectiveSelectedEvolutionDate || prev,
                        1,
                      ),
                    )
                  }
                  aria-label="Dia siguiente"
                  disabled={isEvolutionNextDisabled}
                >
                  <v.iconoflechaderecha />
                </button>
              </div>
            ) : (
              <div className="periodSummary">
                <span className="periodLabel">Periodo de internacion</span>
                <strong>{evolutionModePeriodLabel}</strong>
              </div>
            )}
          </div>

          <div className="actionsGroup">
            {canPrintEvolutions ? (
              <Btn1
                icono={<v.iconoWord />}
                titulo="Imprimir evoluciones"
                bgcolor="var(--bg-accent-soft-strong)"
                funcion={() => setOpenPrintEvolucionesModal(true)}
              />
            ) : null}
            {canCreateEvolution ? (
              <Btn1
                icono={<v.iconoagregar />}
                titulo="Agregar evolucion"
                bgcolor={v.colorPrincipal}
                funcion={() => {
                  setSelectedEvolucionToEdit(null);
                  setOpenEvolucionModal(true);
                }}
              />
            ) : null}
          </div>
        </TabControls>
      ) : null}

      {activeTab === "indicaciones" && (canPrintIndicacion || canCreateIndicacionAction) ? (
        <TabControls>
          <div className="filtersGroup" />

          <div className="actionsGroup">
            {canPrintIndicacion ? (
              <Btn1
                icono={<v.iconopdf />}
                titulo="Descargar PDF"
                bgcolor="var(--bg-accent-soft-strong)"
                funcion={handleDownloadIndicacionPdf}
              />
            ) : null}
            {canCreateIndicacionAction ? (
              <Btn1
                icono={<v.iconoagregar />}
                titulo="Agregar indicaciones"
                bgcolor={v.colorPrincipal}
                funcion={() => {
                  setSelectedIndicacionToEdit(null);
                  setOpenIndicacionModal(true);
                }}
              />
            ) : null}
          </div>
        </TabControls>
      ) : null}

      {activeTab === "estudios" && canCreateEstudio ? (
        <TabControls>
          <div className="filtersGroup" />

          <div className="actionsGroup">
            <Btn1
              icono={<v.iconoagregar />}
              titulo="Agregar estudio"
              bgcolor={v.colorPrincipal}
              funcion={() => {
                setSelectedEstudioToEdit(null);
                setOpenEstudioModal(true);
              }}
            />
          </div>
        </TabControls>
      ) : null}

      {activeTab === "epicrisis" ? (
        <TabControls>
          <div className="filtersGroup" />

          <div className="actionsGroup">
            {canDownloadEpicrisis ? (
              <Btn1
                icono={<v.iconoWord />}
                titulo="Descargar Word"
                bgcolor="var(--bg-accent-soft-strong)"
                funcion={handleDownloadEpicrisisWord}
              />
            ) : null}
          </div>
        </TabControls>
      ) : null}

      {!episodeEditable && selectedIngreso ? (
        <ReadonlyBanner>
          {activeTab === "evoluciones"
            ? "Episodio cerrado: el contenido esta en modo solo lectura. Las evoluciones del dia actual pueden editarse hasta finalizar la jornada."
            : "Episodio cerrado: contenido en modo solo lectura."}
        </ReadonlyBanner>
      ) : null}

      <TabContent>
        {tabLoading ? <Spinner1 /> : null}
        {tabError ? (
          <span>ha ocurrido un error: {tabError.message}</span>
        ) : null}
        {!tabLoading && !tabError && activeTab === "evoluciones" && (
          evolutionIngresoId ? (
            evoluciones.length ? (
              <TablaPacienteEvoluciones
                data={evoluciones}
                canEditRow={canEditEvolution}
                onEdit={(item) => {
                  setSelectedEvolucionToEdit(item);
                  setOpenEvolucionModal(true);
                }}
              />
            ) : (
              <EmptyState>{evolutionEmptyStateLabel}</EmptyState>
            )
          ) : (
            <EmptyState>Seleccione un ingreso para ver las evoluciones.</EmptyState>
          )
        )}
        {!tabLoading && !tabError && activeTab === "indicaciones" && (
          selectedIngresoId ? (
            indicaciones.length ? (
              <TablaPacienteIndicaciones
                data={indicaciones}
                canEditRow={canEditIndicacion}
                onEdit={(item) => {
                  setSelectedIndicacionToEdit(item);
                  setOpenIndicacionModal(true);
                }}
              />
            ) : (
              <EmptyState>Sin indicaciones registradas para esta internacion.</EmptyState>
            )
          ) : (
            <EmptyState>Seleccione un ingreso para ver las indicaciones.</EmptyState>
          )
        )}
        {!tabLoading && !tabError && activeTab === "estudios" && (
          selectedIngresoId ? (
            estudios.length ? (
              <TablaPacienteEstudios
                data={estudios}
                canEditRow={canEditEstudio}
                onEdit={(item) => {
                  setSelectedEstudioToEdit(item);
                  setOpenEstudioModal(true);
                }}
              />
            ) : (
              <EmptyState>Sin estudios registrados para esta internacion.</EmptyState>
            )
          ) : (
            <EmptyState>Seleccione un ingreso para ver los estudios.</EmptyState>
          )
        )}
        {!tabLoading && !tabError && activeTab === "equipo" && (
          <PacienteEquipoTratanteTab
            pacienteId={pacienteId}
            ingreso={selectedIngreso ?? activeIngreso}
            empresaId={paciente?.empresa_id ?? null}
            data={equipo}
            canManageTeam={canManageTeam}
          />
        )}
        {!tabLoading && !tabError && activeTab === "epicrisis" && (
          !epicrisisIngresoContext ? (
            <EmptyState>Seleccione una internacion cerrada para ver la epicrisis.</EmptyState>
          ) : epicrisis ? (
            <PacienteEpicrisisView
              paciente={paciente}
              ingreso={epicrisisIngresoContext}
              epicrisis={epicrisis}
              cobertura={epicrisisCobertura}
            />
          ) : (
            <EmptyState>Sin epicrisis registrada para esta internacion.</EmptyState>
          )
        )}
      </TabContent>

      {openIngresoModal && (
        <ModalPacienteIngresoForm
          empresaId={paciente.empresa_id ?? null}
          sucursalId={ingresoModalSucursalId}
          pacientePreselected={paciente}
          onClose={() => setOpenIngresoModal(false)}
        />
      )}
      {openIndicacionModal && selectedIngresoId ? (
        <ModalPacienteIndicacionForm
          pacienteId={pacienteId}
          ingresoId={selectedIngresoId}
          indicacionPreselected={selectedIndicacionToEdit}
          queryKey={indicacionesQueryKey}
          onClose={() => {
            setOpenIndicacionModal(false);
            setSelectedIndicacionToEdit(null);
          }}
        />
      ) : null}
      {openEstudioModal && selectedIngresoId ? (
        <ModalPacienteEstudioForm
          pacienteId={pacienteId}
          ingresoId={selectedIngresoId}
          estudioPreselected={selectedEstudioToEdit}
          queryKey={estudiosQueryKey}
          onClose={() => {
            setOpenEstudioModal(false);
            setSelectedEstudioToEdit(null);
          }}
        />
      ) : null}
      {openEvolucionModal && evolutionIngresoId ? (
        <ModalPacienteEvolucionForm
          pacienteId={pacienteId}
          ingresoId={evolutionIngresoId}
          selectedDate={evolutionDateRestriction}
          evolucionPreselected={selectedEvolucionToEdit}
          queryKey={evolutionQueryKey}
          onClose={() => {
            setOpenEvolucionModal(false);
            setSelectedEvolucionToEdit(null);
          }}
        />
      ) : null}
      {openPrintEvolucionesModal ? (
        <ModalPacienteEvolucionesPrintForm
          ingreso={evolutionIngresoContext}
          defaultFromDate={
            evolutionViewMode === "period"
              ? evolutionPeriodBounds.fromDate
              : effectiveSelectedEvolutionDate
          }
          defaultToDate={
            evolutionViewMode === "period"
              ? evolutionPeriodBounds.toDate
              : effectiveSelectedEvolutionDate
          }
          onClose={() => setOpenPrintEvolucionesModal(false)}
          onPrint={handlePrintEvoluciones}
        />
      ) : null}
      {openEditPacienteModal && (
        <ModalPacienteIngresoForm
          mode="editPatient"
          empresaId={paciente.empresa_id ?? null}
          pacientePreselected={paciente}
          ingresoPreselected={selectedIngreso ?? activeIngreso}
          editReferenceDate={coverageReferenceDate}
          onClose={() => setOpenEditPacienteModal(false)}
        />
      )}
      {openEgresoModal && activeIngreso && (
        <ModalPacienteEgresoForm
          pacienteId={pacienteId}
          ingreso={activeIngreso}
          patientName={patientName}
          onClose={() => setOpenEgresoModal(false)}
        />
      )}
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  min-width: 0;
  min-height: calc(100dvh - 30px);
  padding: 16px 20px 22px;
  display: grid;
  gap: 12px;
  align-content: start;
  align-items: start;
  background: ${({ theme }) => theme.bgtotal};

  @media ${DeviceMax.mobile} {
    padding: 20px 22px 28px;
    gap: 16px;
  }
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 5;
  background: ${({ theme }) => theme.bgtotal};
  padding: 4px 0 2px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  align-self: start;

  .titleGroup {
    display: grid;
    gap: 6px;
    min-width: 0;
    width: 100%;
  }

  h2 {
    margin: 0;
    font-size: 1.4rem;
    line-height: 1.15;
  }

  .summaryRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
  }

  .ctaGroup {
    display: flex;
    gap: 8px;
    align-items: center;
    flex: 0 0 auto;
  }

  .ctaGroup button {
    white-space: nowrap;
  }

  @media ${DeviceMax.mobile} {
    padding: 10px 0 6px;
    gap: 12px;

    .titleGroup {
      gap: 12px;
    }

    h2 {
      font-size: 1.28rem;
    }

    .summaryRow {
      align-items: center;
      gap: 10px;
      flex-wrap: nowrap;
    }

    .badges {
      flex: 1 1 auto;
      gap: 6px;
      align-items: center;
    }

    .ctaGroup {
      gap: 0;
    }

    .ctaGroup button {
      padding: 8px 14px;
      border-radius: 14px;
      font-size: 0.82rem;
      min-height: 40px;
    }

    .ctaGroup button .content {
      gap: 8px;
      align-items: center;
    }
  }
`;

const HeaderWarning = styled.div`
  width: fit-content;
  max-width: min(100%, 640px);
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-warning-soft);
  background: var(--bg-warning-soft);
  color: var(--color-warning);
  font-size: 0.9rem;
  line-height: 1.35;
  font-weight: 700;
`;

const StatusTag = styled.span`
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.8rem;
  border: 1px solid ${({ theme }) => theme.color2};

  &.active {
    border-color: var(--color-success);
    color: var(--color-success);
  }

  &.closed {
    border-color: var(--color-danger);
    color: var(--color-danger);
  }
`;

const CardHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  @media ${DeviceMax.mobile} {
    flex-direction: column;
    align-items: stretch;
  }
`;

const CardHeaderTitleButton = styled.button`
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.text};
  padding: 0;
  text-align: left;
  cursor: pointer;

  .title {
    display: block;
    font-size: 1rem;
    font-weight: 700;
  }
`;

const CardHeaderActions = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex: 0 0 auto;

  @media ${DeviceMax.mobile} {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
`;

const SectionToggle = styled.button`
  width: auto;
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.text};
  padding: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  cursor: pointer;

  .title {
    display: block;
    font-size: 1rem;
    font-weight: 700;
  }

  small {
    display: block;
    margin-top: 3px;
    color: ${({ theme }) => theme.textsecundary};
  }

  .chevron {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.color1};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding-top: 2px;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .chevronIcon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.05rem;
    line-height: 1;
    transition: transform 160ms ease;
  }

  .chevron.expanded .chevronIcon {
    transform: rotate(180deg);
  }
`;

const SectionInlineToggle = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.color1};
  padding: 8px 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  flex: 0 0 auto;

  .chevronIcon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.05rem;
    line-height: 1;
    transition: transform 160ms ease;
  }

  &.expanded .chevronIcon {
    transform: rotate(180deg);
  }
`;

const CardActionButton = styled.button`
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 999px;
  background: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.color1};
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex: 0 0 auto;

  &:hover {
    border-color: ${({ theme }) => theme.color1};
    background: var(--bg-accent-soft);
  }

  @media ${DeviceMax.mobile} {
    align-self: flex-start;
    padding: 7px 10px;
    font-size: 0.85rem;
  }
`;

const TimelineCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 14px 16px;
  box-shadow: var(--shadow-elev-1);
  display: grid;
  gap: 8px;
  align-content: start;
  align-self: start;
  height: fit-content;

  &.collapsed {
    gap: 4px;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .timelineList {
    display: grid;
    gap: 8px;
  }

  .timelineEntry {
    display: grid;
    gap: 6px;
  }

  .timelineHead {
    display: none;
  }

  .timelineItem {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    background: transparent;
    color: ${({ theme }) => theme.text};
    cursor: pointer;
    text-align: left;
    padding: 10px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1.1fr 1.4fr 2.1fr 0.9fr 0.9fr;
    gap: 8px;
    font-size: 0.9rem;
    align-items: center;
  }

  .timelineItem span.diagnosis {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .timelineItem.active {
    border-color: ${({ theme }) => theme.color1};
    background: var(--bg-accent-soft);
  }

  .timelineChanges {
    border-left: 2px solid ${({ theme }) => theme.color2};
    margin-left: 10px;
    padding-left: 12px;
    display: grid;
    gap: 6px;
  }

  .changesTitle {
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .changesList {
    display: grid;
    gap: 6px;
  }

  .changeItem {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 10px;
    font-size: 0.86rem;
    color: ${({ theme }) => theme.text};
  }

  .changeItem strong {
    font-size: 0.82rem;
    color: ${({ theme }) => theme.textsecundary};
  }

  .status {
    font-weight: 600;
  }

  .status.active {
    color: var(--color-success);
  }

  .status.closed {
    color: var(--color-danger);
  }

  @media ${Device.tablet} {
    .timelineHead {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1.1fr 1.4fr 2.1fr 0.9fr 0.9fr;
      gap: 8px;
      padding: 0 10px 2px;
      color: ${({ theme }) => theme.textsecundary};
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
  }

  @media ${DeviceMax.tablet} {
    .timelineItem {
      grid-template-columns: 1fr;
    }

    .timelineItem span {
      display: grid;
      gap: 2px;
    }

    .timelineItem span::before {
      content: attr(data-label);
      font-size: 0.78rem;
      color: ${({ theme }) => theme.textsecundary};
      font-weight: 600;
    }

    .timelineItem span.diagnosis {
      overflow-wrap: anywhere;
    }

    .timelineChanges {
      margin-left: 0;
      padding-left: 10px;
    }
  }
`;

const InfoCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 16px 18px;
  box-shadow: var(--shadow-elev-1);
  display: grid;
  gap: 12px;
  align-content: start;
  align-self: start;
  height: fit-content;

  &.collapsed {
    padding-top: 14px;
    padding-bottom: 14px;
    gap: 6px;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 14px 22px;
  grid-template-columns: repeat(1, minmax(0, 1fr));

  @media ${Device.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media ${Device.tablet} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media ${Device.laptop} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const AntecedentesLayout = styled.div`
  display: grid;
  gap: 12px;
`;

const AntecedentesGroup = styled.section`
  border: 1px dashed ${({ theme }) => theme.color2};
  border-radius: 14px;
  padding: 12px;
  //background: ${({ theme }) => theme.bgtotal};
  display: grid;
  gap: 12px;

  .groupHeader {
    display: grid;
    gap: 2px;
  }

  .groupHeader h4 {
    margin: 0;
    font-size: 1rem;
  }

  .groupHeader small {
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.84rem;
  }
`;

const AntecedentesGrid = styled.div`
  display: grid;
  gap: 14px 18px;
  grid-template-columns: repeat(1, minmax(0, 1fr));

  .full {
    grid-column: 1 / -1;
  }

  @media ${Device.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media ${Device.tablet} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const ArrayPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 6px 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: var(--bg-accent-soft);
    color: ${({ theme }) => theme.color1};
    font-size: 0.84rem;
    font-weight: 700;
  }
`;

const InfoItem = styled.div`
  display: grid;
  gap: 6px;

  .label {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.textsecundary};
  }

  .value {
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
    word-break: break-word;
    overflow-wrap: anywhere;
    white-space: normal;
  }
`;

const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 6px;

  .tab {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 999px;
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    height: 42px;
    cursor: pointer;
    font-weight: 600;
  }

  .tab.active {
    border-color: ${({ theme }) => theme.color1};
    color: ${({ theme }) => theme.color1};
    background: var(--bg-accent-soft);
  }
`;

const TabControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  .filtersGroup {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .filtersGroup.evolutionFilters {
    align-items: center;
    gap: 10px;
    flex: 1 1 520px;
  }

  .actionsGroup {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .modeSwitch {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: ${({ theme }) => theme.bg};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 999px;
    padding: 4px;
  }

  .modeSwitch button {
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.text};
    border-radius: 999px;
    padding: 8px 14px;
    font-weight: 700;
    cursor: pointer;
    min-width: 88px;
    transition:
      background 0.2s ease,
      color 0.2s ease,
      opacity 0.2s ease;
  }

  .modeSwitch button.active {
    background: var(--bg-accent-soft);
    color: ${({ theme }) => theme.color1};
  }

  .modeSwitch button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .dateFilter {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: ${({ theme }) => theme.bg};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 999px;
    padding: 6px 12px;
  }

  .dateFilter button {
    border: none;
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.text};
    cursor: pointer;
    font-size: 18px;
  }

  .dateFilter button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .dateFilter input {
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.text};
    font-weight: 600;
    font-size: 0.95rem;
    outline: none;
  }

  .periodSummary {
    display: grid;
    gap: 2px;
    background: ${({ theme }) => theme.bg};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 16px;
    padding: 8px 12px;
  }

  .periodSummary strong {
    font-size: 0.98rem;
    color: ${({ theme }) => theme.text};
  }

  .periodLabel {
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.82rem;
  }

  @media ${DeviceMax.mobile} {
    align-items: stretch;

    .filtersGroup,
    .actionsGroup {
      width: 100%;
    }

    .actionsGroup {
      justify-content: stretch;
    }

    .actionsGroup button {
      width: 100%;
    }

    .modeSwitch,
    .periodSummary,
    .dateFilter {
      width: 100%;
    }

    .dateFilter {
      justify-content: space-between;
    }
  }
`;

const ReadonlyBanner = styled.div`
  border: 1px dashed ${({ theme }) => theme.color2};
  border-radius: 10px;
  padding: 10px 12px;
  color: ${({ theme }) => theme.textsecundary};
`;

const TabContent = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 14px 16px;
  box-shadow: var(--shadow-elev-1);
  align-self: start;
  align-content: start;
  height: fit-content;
`;

const EmptyState = styled.div`
  padding: 18px;
  border-radius: 12px;
  border: 1px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.textsecundary};
  text-align: center;
`;

const ContactTable = styled.div`
  display: grid;
  gap: 8px;

  .contactHead {
    display: none;
  }

  .contactRow {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    padding: 10px;
    display: grid;
    grid-template-columns: 1.1fr 1.5fr 1.2fr 1.3fr;
    gap: 10px;
    align-items: center;
    background: transparent;
  }

  .contactRow span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  @media ${Device.tablet} {
    .contactHead {
      display: grid;
      grid-template-columns: 1.1fr 1.5fr 1.2fr 1.3fr;
      gap: 10px;
      padding: 0 10px 2px;
      color: ${({ theme }) => theme.textsecundary};
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
  }

  @media ${DeviceMax.tablet} {
    .contactRow {
      grid-template-columns: 1fr;
      gap: 6px;
    }

    .contactRow span {
      display: grid;
      gap: 2px;
    }

    .contactRow span::before {
      content: attr(data-label);
      font-size: 0.78rem;
      color: ${({ theme }) => theme.textsecundary};
      font-weight: 600;
    }
  }
`;
