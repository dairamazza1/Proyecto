import { v } from "../styles/variables";

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
  { id: "licencias", label: "Licencias" },
  { id: "faltas", label: "Faltas" },
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
    roles: ["admin", "rrhh", "employee"],
  },
  {
    label: "Empleados",
    icon: "streamline-flex:office-building-1",
    to: "/empleados",
    roles: ["admin", "rrhh"],
  },
  {
    label: "Reportes",
    icon: "streamline-flex:new-sticky-note",
    to: "/reportes",
    roles: ["admin", "rrhh"],
  },
  {
    label: "Enfermeria",
    icon: "mdi:stethoscope",
    to: "/enfermeria",
    roles: ["admin", "employee"],
    requiresNurse: true,
  },
];
export const SecondarylinksArray = [
  {
    label: "Notificaciones",
    icon: "mdi:bell-outline",
    to: "/notificaciones",
    roles: ["admin", "rrhh"],
  },
  {
    label: "Mi perfil",
    icon: "streamline-flex:user-circle-single",
    to: "/perfil",
    roles: ["admin", "rrhh", "employee"],
  },

  {
    label: "Configuración",
    icon: "streamline-flex:sun",
    to: "/configuracion",
    roles: ["admin", "rrhh", "employee"],
  },
];
