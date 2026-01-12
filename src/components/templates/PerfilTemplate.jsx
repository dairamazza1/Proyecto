import styled from "styled-components";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Btn1,
  CambiosSection,
  InputText2,
  LicenciasSection,
  Title,
  VacacionesSection,
} from "../../index";
import { supabase } from "../../supabase/supabase.config.jsx";

export function PerfilTemplate({ perfil, empleado, displayName, userEmail }) {
  const email = perfil?.email || userEmail || "";
  const emailLabel = email || "-";
  const role =
    perfil?.role ||
    perfil?.app_role ||
    perfil?.rol ||
    perfil?.id_role ||
    "-";

  const profileId = perfil?.id || "-";
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordStatus, setPasswordStatus] = useState({
    error: "",
    success: "",
  });

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Ingresa tu contrasena actual";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "Ingresa una contrasena nueva";
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "La contrasena debe tener al menos 6 caracteres";
    } else if (passwordData.newPassword === passwordData.currentPassword) {
      errors.newPassword = "La nueva contrasena debe ser distinta";
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Confirma la contrasena nueva";
    } else if (passwordData.confirmPassword !== passwordData.newPassword) {
      errors.confirmPassword = "Las contrasenas no coinciden";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const { mutate: changePassword, isPending } = useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      if (!email) {
        throw new Error("Email no disponible");
      }
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (authError) throw authError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
    },
    onError: (err) => {
      const message = err?.message || "No se pudo actualizar la contrasena";
      const resolved =
        message.includes("Invalid login credentials")
          ? "Contrasena actual incorrecta"
          : message;
      setPasswordStatus({ error: resolved, success: "" });
    },
    onSuccess: () => {
      setPasswordStatus({
        error: "",
        success: "Contrasena actualizada correctamente",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
    },
  });

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (passwordStatus.error || passwordStatus.success) {
      setPasswordStatus({ error: "", success: "" });
    }
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (!validatePasswordForm()) return;
    setPasswordStatus({ error: "", success: "" });
    changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  return (
    <Container>
      <Header>
        <div className="titleGroup">
          <Title>Mi Perfil</Title>
          <h2>{displayName}</h2>
        </div>
      </Header>

      <InfoCard>
        <InfoGrid>
          <InfoItem>
            <span className="label">Email</span>
            <span className="value">{emailLabel}</span>
          </InfoItem>
          <InfoItem>
            <span className="label">Rol</span>
            <span className="value">{role}</span>
          </InfoItem>
          <InfoItem>
            <span className="label">ID Perfil</span>
            <span className="value">{profileId}</span>
          </InfoItem>
        </InfoGrid>
      </InfoCard>

      <PasswordCard>
        <div className="cardHeader">
          <div>
            <h3>Cambiar contrasena</h3>
            <p>Actualiza tu contrasena de acceso.</p>
          </div>
        </div>
        <form className="passwordForm" onSubmit={handlePasswordSubmit}>
          <InputText2>
            <input
              className="form__field"
              placeholder="Contrasena actual"
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
            />
            {passwordErrors.currentPassword && (
              <ErrorText>{passwordErrors.currentPassword}</ErrorText>
            )}
          </InputText2>

          <InputText2>
            <input
              className="form__field"
              placeholder="Nueva contrasena"
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
            />
            {passwordErrors.newPassword && (
              <ErrorText>{passwordErrors.newPassword}</ErrorText>
            )}
          </InputText2>

          <InputText2>
            <input
              className="form__field"
              placeholder="Confirmar nueva contrasena"
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
            />
            {passwordErrors.confirmPassword && (
              <ErrorText>{passwordErrors.confirmPassword}</ErrorText>
            )}
          </InputText2>

          {passwordStatus.error && (
            <ErrorText>{passwordStatus.error}</ErrorText>
          )}
          {passwordStatus.success && (
            <SuccessText>{passwordStatus.success}</SuccessText>
          )}

          <Btn1
            tipo="submit"
            titulo={isPending ? "GUARDANDO..." : "GUARDAR"}
            bgcolor="rgb(143, 191, 250)"
            color="255,255,255"
            width="100%"
            disabled={isPending || !email}
          />
        </form>
      </PasswordCard>

      {!empleado && (
        <EmptyState>
          Tu perfil aun no esta asociado a un empleado. Contacta administracion.
        </EmptyState>
      )}

      {empleado && (
        <>
          <VacacionesSection
            empleado={empleado}
            empleadoId={empleado.id}
            title="Mis vacaciones"
          />
          <LicenciasSection empleadoId={empleado.id} title="Mis licencias" />
          <CambiosSection empleadoId={empleado.id} title="Mis cambios de turnos" />
        </>
      )}
    </Container>
  );
}

const Container = styled.div`
  min-height: calc(100dvh - 30px);
  padding: 20px 22px 28px;
  display: grid;
  gap: 16px;
  background: ${({ theme }) => theme.bgtotal};
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  .titleGroup {
    display: grid;
    gap: 6px;
  }

  h2 {
    font-size: 1.2rem;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }
`;

const InfoCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 16px 24px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  }
`;

const PasswordCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  display: grid;
  gap: 16px;

  .cardHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    h3 {
      margin: 0 0 6px;
      font-size: 1.1rem;
    }

    p {
      margin: 0;
      color: ${({ theme }) => theme.textsecundary};
      font-size: 0.95rem;
    }
  }

  .passwordForm {
    display: grid;
    gap: 6px;
  }
`;

const ErrorText = styled.span`
  color: #ff4444;
  font-size: 12px;
  display: block;
  margin-top: 5px;
  text-align: left;
`;

const SuccessText = styled.span`
  color: #2eaf5d;
  font-size: 12px;
  display: block;
  margin-top: 5px;
  text-align: left;
`;

const EmptyState = styled.div`
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.textsecundary};
  text-align: center;
`;
