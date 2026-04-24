import { v } from "../styles/variables";
import { FEATURES } from "./features";

export const DesplegableUser = [
  {
    text: "Mi perfil",
    icono: <v.iconoUser />,
    tipo: "miperfil",
  },
  {
    text: "configuración",
    icono: <v.iconoSettings />,
    tipo: "configuración",
  },
  {
    text: "Cerrar sesión",
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
    label: "Pacientes",
    icon: "fontisto:bed-patient",
    to: "/pacientes",
    feature: FEATURES.PACIENTES,
  },
  {
    label: "Enfermeria",
    icon: v.iconoEnfermera,
    to: "/enfermeria",
    feature: FEATURES.ENFERMERIA,
  },
  {
    label: "Empleados",
    icon: "streamline-plump:office-worker",
    to: "/empleados",
    feature: FEATURES.EMPLEADOS,
  },
  {
    label: "Reportes",
    icon: "carbon:report",
    to: "/reportes",
    feature: FEATURES.REPORTES,
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
