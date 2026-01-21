import styled from "styled-components";
import { HomeCards, Title, usePermissions, v } from "../../index";
import { useMemo } from "react";

export function HomeTemplate({ displayName = "Usuario" }) {
  const { userRole, isAdmin, isNurseEmployee, empleado, defaultTabFromShift } =
    usePermissions();
  const isEmployee = userRole === "employee";
  const isNurse = isNurseEmployee();
  const canSeeEnfermeria = isAdmin() || isNurse;

  const cards = useMemo(() => {
    const baseCards = isEmployee
      ? [
          {
            title: "Mi perfil",
            description:
              "Revisa tus datos y solicitudes de vacaciones y licencias.",
            to: "/perfil",
            icon: v.iconoUser,
          },
        ]
      : [
          {
            title: "Empleados",
            description: "Gestiona los perfiles de los empleados.",
            to: "/empleados",
            icon: v.iconoempresa,
          },
          {
            title: "Reportes",
            description:
              "Consulta las vacaciones y licencias programadas de los empleados.",
            to: "/reportes",
            icon: v.iconoreportes,
          },
          {
            title: "Mi perfil",
            description:
              "Revisa tus datos y solicitudes de vacaciones y licencias.",
            to: "/perfil",
            icon: v.iconoUser,
          },
        ];

    if (!canSeeEnfermeria) return baseCards;

    const enfermeriaLink = isNurse
      ? `/enfermeria?tab=${defaultTabFromShift(empleado?.shift)}`
      : "/enfermeria";
    const enfermeriaCard = {
      title: "Enfermeria",
      description: "Registros diarios del area de enfermeria.",
      to: enfermeriaLink,
      icon: v.iconoProfesional,
    };

    if (isEmployee) {
      return [enfermeriaCard, ...baseCards];
    }

    return [baseCards[0], enfermeriaCard, ...baseCards.slice(1)];
  }, [
    isEmployee,
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
