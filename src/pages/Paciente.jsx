import { useParams } from "react-router-dom";
import { PacienteTemplate } from "../index";

export function Paciente() {
  const { id } = useParams();
  return <PacienteTemplate pacienteId={id} />;
}
