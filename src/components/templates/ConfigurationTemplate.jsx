import styled from "styled-components";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Btn1,
  HomeCards,
  InputText2,
  Title,
  usePermissions,
  v,
} from "../../index";
import { useAuthStore } from "../../context/AuthStoreWithPermissions";
import { supabase } from "../../supabase/supabase.config.jsx";

export function ConfigurationTemplate() {
  const navigate = useNavigate();
  const { userRole } = usePermissions();
  const { cerrarSesion } = useAuthStore();
  const user = useAuthStore((state) => state.user);
  const email = user?.email || "";
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  const canInvite = ["rrhh", "admin"].includes(userRole);
  const cards = [
    ...(canInvite
      ? [
          {
            title: "Invitar empleado",
            description: "Invita empleados por email y revisa su estado.",
            to: "/configuracion/invitaciones",
            icon: v.iconoagregar,
          },
        ]
      : []),
    {
      title: "Cambiar contraseña",
      description: "Actualiza tu contraseña de acceso.",
      icon: v.iconopass,
      onClick: () => setPasswordModalOpen(true),
    },
  ];

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
      errors.currentPassword = "Ingresa tu contraseña actual";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "Ingresa una contraseña nueva";
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "La contraseña debe tener al menos 6 caracteres";
    } else if (passwordData.newPassword === passwordData.currentPassword) {
      errors.newPassword = "La nueva contraseña debe ser distinta";
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Confirma la contraseña nueva";
    } else if (passwordData.confirmPassword !== passwordData.newPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
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
      const message = err?.message || "No se pudo actualizar la contraseña";
      const resolved = message.includes("Invalid login credentials")
        ? "Contraseña actual incorrecta"
        : message;
      setPasswordStatus({ error: resolved, success: "" });
    },
    onSuccess: () => {
      setPasswordStatus({
        error: "",
        success: "Contraseña actualizada correctamente",
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

  const handleClosePasswordModal = useCallback(() => {
    setPasswordModalOpen(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    setPasswordStatus({ error: "", success: "" });
  }, []);

  const handlePasswordOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      handleClosePasswordModal();
    }
  };

  useEffect(() => {
    if (!isPasswordModalOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClosePasswordModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPasswordModalOpen, handleClosePasswordModal]);

  const handleLogout = async () => {
    await cerrarSesion();
    navigate("/login");
  };

  return (
    <Container>
      <Header>
        <div className="titleGroup">
          <Title>Configuración</Title>
          <p>Accesos rápidos para administrar tu cuenta.</p>
        </div>

        <div className="actions">
          <Btn1
            funcion={handleLogout}
            bgcolor={v.colorPrincipal}
            titulo="Cerrar sesión"
            icono={<v.iconoCerrarSesion />}
            tipo="button"
          />
        </div>
      </Header>

      {cards.length ? <HomeCards cards={cards} /> : null}

      {isPasswordModalOpen && (
        <ModalOverlay onClick={handlePasswordOverlayClick}>
          <ModalContent onClick={(event) => event.stopPropagation()}>
            <PasswordCard>
              <div className="cardHeader">
                <div>
                  <h3>Cambiar contraseña</h3>
                  <p>Actualiza tu contraseña de acceso.</p>
                </div>
                <button
                  type="button"
                  className="closeButton"
                  onClick={handleClosePasswordModal}
                  aria-label="Cerrar"
                >
                  <v.iconocerrar />
                </button>
              </div>
              <form className="passwordForm" onSubmit={handlePasswordSubmit}>
                <InputText2>
                  <input
                    className="form__field"
                    placeholder="Contraseña actual"
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
                    placeholder="Nueva contraseña"
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
                    placeholder="Confirmar nueva contraseña"
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
                  bgcolor={v.colorPrincipal}
                  color="255,255,255"
                  width="100%"
                  disabled={isPending || !email}
                />
              </form>
            </PasswordCard>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

const Container = styled.div`
  background-color: ${({ theme }) => theme.bgtotal};
  min-height: calc(100dvh - 30px);
  padding: 24px;
  display: grid;
  gap: 16px;
  align-content: start;
  align-items: start;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;

  .titleGroup {
    display: grid;
    gap: 10px;
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.textsecundary};
    font-weight: 500;
  }
`;

const ModalOverlay = styled.div`
  transition: 0.3s;
  top: 0;
  left: 0;
  position: fixed;
  background-color: var(--overlay-backdrop);
  display: flex;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px 16px;
`;

const ModalContent = styled.div`
  width: min(540px, 100%);
  max-width: 100%;
`;

const PasswordCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: var(--shadow-elev-1);
  display: grid;
  gap: 16px;
  width: 100%;
  box-sizing: border-box;

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

  .closeButton {
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.text};

    svg {
      width: 20px;
      height: 20px;
    }
  }

  .passwordForm {
    display: grid;
    gap: 6px;
  }
`;

const ErrorText = styled.span`
  color: var(--color-danger);
  font-size: 12px;
  display: block;
  margin-top: 5px;
  text-align: left;
`;

const SuccessText = styled.span`
  color: var(--color-success);
  font-size: 12px;
  display: block;
  margin-top: 5px;
  text-align: left;
`;
