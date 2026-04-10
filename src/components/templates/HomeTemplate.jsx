import styled from "styled-components";
import { HomeCards, Title, usePermissions, v } from "../../index";
import { useMemo } from "react";

export function HomeTemplate({ displayName = "Usuario" }) {
  const { canRead, isNurseEmployee, empleado, defaultTabFromShift } =
    usePermissions();
  const isNurse = isNurseEmployee();
  const canSeeEnfermeria = canRead("enfermeria");
  const canSeeEmpleados = canRead("empleados");
  const canSeePacientes = canRead("pacientes");
  const canSeeReportes = canRead("reportes");

  const cards = useMemo(() => {
    const baseCards = [];

    if (canSeeEmpleados) {
      baseCards.push({
        title: "Empleados",
        description: "Gestiona los perfiles de los empleados.",
        to: "/empleados",
        icon: v.iconoempresa,
      });
    }

    if (canSeePacientes) {
      baseCards.push({
        title: "Pacientes",
        description: "Gestiona ingresos y seguimiento de pacientes.",
        to: "/pacientes",
        icon: v.iconoUser,
      });
    }

    if (canSeeReportes) {
      baseCards.push({
        title: "Reportes",
        description:
          "Consulta las vacaciones y licencias programadas de los empleados.",
        to: "/reportes",
        icon: v.iconoreportes,
      });
    }

    baseCards.push({
      title: "Mi perfil",
      description:
        "Revisa tus datos y solicitudes de vacaciones y licencias.",
      to: "/perfil",
      icon: v.iconoUser,
    });

    if (!canSeeEnfermeria) return baseCards;

    const enfermeriaLink = isNurse
      ? `/enfermeria?tab=${defaultTabFromShift(empleado?.shift)}`
      : "/enfermeria";
    const enfermeriaCard = {
      title: "Enfermeria",
      description: "Registros diarios del area de enfermeria.",
      to: enfermeriaLink,
      icon: v.iconoEnfermera,
    };

    if (!canSeeEmpleados && !canSeePacientes && !canSeeReportes) {
      return [enfermeriaCard, ...baseCards];
    }

    return [baseCards[0], enfermeriaCard, ...baseCards.slice(1)];
  }, [
    canSeeEmpleados,
    canSeePacientes,
    canSeeReportes,
    canSeeEnfermeria,
    isNurse,
    defaultTabFromShift,
    empleado?.shift,
  ]);

  return (
    <Container>
      <Header>
        <Title>Bienvenido/a {displayName}</Title>
        <p>Accesos rapidos para continuar tu trabajo.</p>
      </Header>
      <HomeCards cards={cards} />
    </Container>
  );
}

const Container = styled.div`
  min-height: calc(100dvh - 30px);
  padding: 24px;
  display: grid;
  gap: 24px;
  align-content: start;
  align-items: start;
  background: ${({ theme }) => theme.bgtotal};
`;

const Header = styled.header`
  display: grid;
  gap: 10px;

  p {
    margin: 0;
    color: ${({ theme }) => theme.textsecundary};
    font-weight: 500;
  }
`;
