import { useMemo } from "react";
import { usePermissions } from "./usePermissions";
import { getArgentinaDateInputFromValue, getArgentinaTodayDateInput } from "../utils/argentinaDateTime";
import {
  filterPacienteEquipoRowsByIngreso,
  isPacienteEquipoAssignmentActive,
  isPacienteEquipoClinicallyEligible,
} from "../utils/pacienteEquipoTratante";

const isIngresoActivo = (ingreso) =>
  String(ingreso?.status ?? "").toLowerCase() === "admitted" &&
  !ingreso?.discharge_at;

export function usePacienteClinicalPermissions({
  equipo = [],
  selectedIngreso = null,
  evolutionIngreso = null,
} = {}) {
  const { canUpdate, can, isAdmin, hasClinicalSectionAccess, empleado, profile } =
    usePermissions();
  const todayDate = getArgentinaTodayDateInput();
  const hasClinicalActionsAccess = hasClinicalSectionAccess();

  const selectedIngresoEquipo = useMemo(
    () => filterPacienteEquipoRowsByIngreso(equipo, selectedIngreso?.id ?? null),
    [equipo, selectedIngreso?.id],
  );

  const evolutionIngresoEquipo = useMemo(
    () => filterPacienteEquipoRowsByIngreso(equipo, evolutionIngreso?.id ?? null),
    [equipo, evolutionIngreso?.id],
  );

  const resolveCurrentUserAssignment = (rows) =>
    (rows ?? []).find((item) => {
      if (String(item?.empleado_id ?? item?.empleado?.id ?? "") !== String(empleado?.id ?? "")) {
        return false;
      }
      return isPacienteEquipoAssignmentActive(item, todayDate);
    }) ?? null;

  const currentSelectedIngresoAssignment = resolveCurrentUserAssignment(
    selectedIngresoEquipo,
  );
  const currentEvolutionIngresoAssignment = resolveCurrentUserAssignment(
    evolutionIngresoEquipo,
  );

  const isAssignedToSelectedIngreso = Boolean(currentSelectedIngresoAssignment);
  const isAssignedToEvolutionIngreso = Boolean(currentEvolutionIngresoAssignment);
  const hasSelectedIngresoClinicalEligibility = Boolean(
    currentSelectedIngresoAssignment &&
      isPacienteEquipoClinicallyEligible(currentSelectedIngresoAssignment),
  );
  const hasEvolutionClinicalEligibility = Boolean(
    currentEvolutionIngresoAssignment &&
      isPacienteEquipoClinicallyEligible(currentEvolutionIngresoAssignment),
  );

  const selectedIngresoEditable = Boolean(
    selectedIngreso && isIngresoActivo(selectedIngreso),
  );
  const evolutionIngresoEditable = Boolean(
    evolutionIngreso && isIngresoActivo(evolutionIngreso),
  );

  const canManageTeam =
    Boolean(selectedIngreso) &&
    selectedIngresoEditable &&
    canUpdate("pacientes");

  const canCreateEvolution =
    Boolean(evolutionIngreso?.id) &&
    evolutionIngresoEditable &&
    (isAdmin() ||
      (hasClinicalActionsAccess &&
        isAssignedToEvolutionIngreso &&
        hasEvolutionClinicalEligibility));

  const canEditEvolution = (evolucion) => {
    const isCurrentArgentinaDay =
      getArgentinaDateInputFromValue(evolucion?.evolution_at) === todayDate;

    if (!isCurrentArgentinaDay) return false;
    if (!evolutionIngresoEditable) return false;
    if (isAdmin()) return true;

    return (
      hasClinicalActionsAccess &&
      isAssignedToEvolutionIngreso &&
      hasEvolutionClinicalEligibility &&
      String(evolucion?.created_by ?? "") === String(profile?.id ?? "")
    );
  };

  const canCreateIndicacion =
    Boolean(selectedIngreso?.id) &&
    selectedIngresoEditable &&
    (isAdmin() ||
      (hasClinicalActionsAccess &&
        isAssignedToSelectedIngreso &&
        hasSelectedIngresoClinicalEligibility));

  const canEditIndicacion = (indicacion) => {
    if (!selectedIngresoEditable) return false;
    if (isAdmin()) return true;

    return (
      hasClinicalActionsAccess &&
      isAssignedToSelectedIngreso &&
      hasSelectedIngresoClinicalEligibility &&
      String(indicacion?.created_by ?? "") === String(profile?.id ?? "")
    );
  };

  const canCreateEstudio =
    Boolean(selectedIngreso?.id) &&
    selectedIngresoEditable &&
    (isAdmin() ||
      (hasClinicalActionsAccess &&
        isAssignedToSelectedIngreso &&
        hasSelectedIngresoClinicalEligibility));

  const canEditEstudio = () => {
    if (!selectedIngresoEditable) return false;
    if (isAdmin()) return true;

    return (
      hasClinicalActionsAccess &&
      isAssignedToSelectedIngreso &&
      hasSelectedIngresoClinicalEligibility
    );
  };

  return {
    canManageTeam,
    selectedIngresoEquipo,
    evolutionIngresoEquipo,
    isAssignedToSelectedIngreso,
    isAssignedToEvolutionIngreso,
    hasSelectedIngresoClinicalEligibility,
    hasEvolutionClinicalEligibility,
    canCreateEvolution,
    canEditEvolution,
    canCreateIndicacion,
    canEditIndicacion,
    canCreateEstudio,
    canEditEstudio,
    canReadPacientesModule: can("pacientes", "view"),
  };
}

