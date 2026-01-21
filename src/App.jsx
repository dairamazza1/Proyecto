import styled, { ThemeProvider } from "styled-components";
import {
  AuthContextProvider,
  GlobalStyles,
  MyRoutes,
  Sidebar,
  useNotificationsUnreadCount,
  usePermissions,
  useThemeStore,
} from "./index";
import { Device } from "./styles/breakpoints";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { v } from "./styles/variables";
import { Icon } from "@iconify/react";


function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { themeStyle } = useThemeStore();
  const { pathname } = useLocation();
  const { userRole } = usePermissions();
  const canSeeNotifications = ["admin", "rrhh"].includes(userRole);
  const { data: unreadCount = 0 } = useNotificationsUnreadCount(
    { limit: 500 },
    canSeeNotifications
  );
  const unreadLabel = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <ThemeProvider theme={themeStyle}>
      <AuthContextProvider>
         <GlobalStyles />
        {pathname !== "/login" &&
        pathname !== "/register" &&
        pathname !== "/set-password" ? (
          <Container className={sidebarOpen ? "active" : ""}>
           
            <section className="contentSidebar">
              <Sidebar
                state={sidebarOpen}
                setState={() => setSidebarOpen(!sidebarOpen)}
              />
            </section>

            <section className="contentHambur">
              <button
                type="button"
                className="hamburButton"
                aria-label={sidebarOpen ? "Cerrar menu" : "Abrir menu"}
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <v.iconocerrar /> : <v.iconomenu />}
              </button>
              <span className="hamburTitle">Menu</span>
              {canSeeNotifications && (
                <div className="hamburActions">
                  <NavLink
                    to="/notificaciones"
                    className="notifyButton"
                    aria-label="Notificaciones"
                  >
                    <Icon icon="mdi:bell-outline" />
                    {unreadCount > 0 && (
                      <span className="badge">{unreadLabel}</span>
                    )}
                  </NavLink>
                </div>
              )}
            </section>

            {sidebarOpen && (
              <div
                className="sidebarOverlay"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
            )}

            <section className="contentRouters">
              <MyRoutes />
            </section>
          </Container>
        ) : (
          <MyRoutes />
        )}
      <ReactQueryDevtools initialIsOpen={true} />

      </AuthContextProvider>
    </ThemeProvider>
  );
}

//componente estilo
const Container = styled.main`
  --mobile-topbar-height: 62px;
  --mobile-sidebar-width: 260px;
  display: grid;
  grid-template-columns: 1fr;
  transition: 0.1s ease-in-out;
  color: ${({ theme }) => theme.text};
  position: relative;
  //mobile
  .contentSidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: var(--mobile-sidebar-width);
    transform: translateX(-110%);
    transition: transform 0.25s ease;
    z-index: 1001;
    pointer-events: none;
  }
  .contentHambur {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--mobile-topbar-height);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    background: ${({ theme }) => theme.bgtotal};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    z-index: 1002;
  }

  .hamburButton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    background: ${({ theme }) => theme.bgAlpha};
    color: ${({ theme }) => theme.text};
    font-size: 22px;
  }

  .hamburTitle {
    font-weight: 700;
    letter-spacing: 0.02em;
    color: ${({ theme }) => theme.text};
  }

  .hamburActions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .notifyButton {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    text-decoration: none;
    background: ${({ theme }) => theme.bgAlpha};
    color: ${({ theme }) => theme.text};
    font-size: 22px;
  }

  .notifyButton .badge {
    position: absolute;
    top: -6px;
    right: -8px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 999px;
    background: var(--color-danger);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 18px;
    text-align: center;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.bgtotal};
  }
  .contentRouters {
    /* background-color: rgb(86, 137, 99); */
    grid-column: 1;
    width: 100%;
    padding-top: var(--mobile-topbar-height);
  }

  .sidebarOverlay {
    position: fixed;
    inset: 0;
    background: var(--overlay-backdrop-soft);
    z-index: 1000;
  }

  &.active {
    .contentSidebar {
      transform: translateX(0);
      pointer-events: auto;
    }
    .contentHambur {
      left: var(--mobile-sidebar-width);
      width: calc(100% - var(--mobile-sidebar-width));
    }
    .hamburTitle {
      display: none;
    }
  }

  @media ${Device.tablet} {
    grid-template-columns: 88px 1fr;
    &.active {
      grid-template-columns: 260px 1fr;
    }
    .contentSidebar {
      position: relative;
      inset: auto;
      width: auto;
      transform: none;
      transition: none;
      z-index: auto;
      pointer-events: auto;
    }
    .contentHambur {
      display: none;
    }
    .contentRouters {
      grid-column: 2;
      padding-top: 0;
    }
    .sidebarOverlay {
      display: none;
    }
  }
`;
export default App;
