import { v } from "../styles/variables";
import { FEATURES } from "./features";

export const DesplegableUser = [
  {
    text: "Mi perfil",
    icono: <v.iconoUser />,
    tipo: "miperfil",
  },
  {
    text: "configuraciÃ³n",
    icono: <v.iconoSettings />,
    tipo: "configuraciÃ³n",
  },
  {
    text: "Cerrar sesiÃ³n",
    icono: <v.iconoCerrarSesion />,
    tipo: "cerrarsesion",
  },
];

export const TABS = [
  { id: "vacaciones", label: "Vacaciones" },

  { id: "faltas", label: "Faltas" },
  { id: "licencias", label: "Licencias extendidas" },
  { id: "cambios", label: "Cambios de turnos (legajo)" },
  { id: "sanciones", label: "Sanciones (legajo)" },
];

export const statusValues = {
  rejected: "Rechazado",
  approved: "Aprobado",
  pending: "Pendiente",
};

//data SIDEBAR
export const LinksArray = [
  {
    label: "Inicio",
    icon: "streamline-flex:home-2",
    to: "/",
    feature: FEATURES.PERFIL,
  },
  {
    label: "Empleados",
    icon: "streamline-flex:office-building-1",
    to: "/empleados",
    feature: FEATURES.EMPLEADOS,
  },
  {
    label: "Reportes",
    icon: "streamline-flex:new-sticky-note",
    to: "/reportes",
    feature: FEATURES.REPORTES,
  },
  {
    label: "Enfermeria",
    icon: "mdi:stethoscope",
    to: "/enfermeria",
    feature: FEATURES.ENFERMERIA,
  },
];
export const SecondarylinksArray = [
  {
    label: "Notificaciones",
    icon: "mdi:bell-outline",
    to: "/notificaciones",
    feature: FEATURES.NOTIFICACIONES,
  },
  {
    label: "Mi perfil",
    icon: "streamline-flex:user-circle-single",
    to: "/perfil",
    feature: FEATURES.PERFIL,
  },

  {
    label: "Configuración",
    icon: "streamline-flex:sun",
    to: "/configuracion",
    feature: FEATURES.PERFIL,
  },
];
