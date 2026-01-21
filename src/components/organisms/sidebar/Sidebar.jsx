import styled from "styled-components";
import {
  LinksArray,
  SecondarylinksArray,
  ToggleTema,
  useNotificationsUnreadCount,
  usePermissions,
} from "../../../index";
import { v } from "../../../styles/variables";
import { NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";

export function Sidebar({ state, setState }) {
  const { userRole, isAdmin, isNurseEmployee } = usePermissions();
  const canSeeNotifications = ["admin", "rrhh"].includes(userRole);
  const canSeeEnfermeria = isAdmin() || isNurseEmployee();

  const { data: unreadCount = 0 } = useNotificationsUnreadCount(
    { limit: 500 },
    canSeeNotifications
  );
  const unreadLabel = unreadCount > 99 ? "99+" : unreadCount;
  const filterByRole = (links) =>
    links
      .filter((link) => !link.roles || link.roles.includes(userRole))
      .filter((link) => !link.requiresNurse || canSeeEnfermeria);
  const primaryLinks = filterByRole(LinksArray);
  const secondaryLinks = filterByRole(SecondarylinksArray);

  const renderLinks = (links) =>
    links.map(({ icon, label, to, color }) => {
      const showBadge =
        canSeeNotifications && to === "/notificaciones" && unreadCount > 0;
      const containerClass = [
        "LinkContainer",
        state ? "active" : "",
        to === "/notificaciones" ? "notificationLink" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return (
        <div className={containerClass} key={label}>
          <NavLink
            to={to}
            className={({ isActive }) => `Links${isActive ? ` active` : ``}`}
          >
            <section className={state ? "content open" : "content"}>
              <span className="iconWrapper">
                <Icon color={color} className="Linkicon" icon={icon} />
                {showBadge && <span className="badge">{unreadLabel}</span>}
              </span>
              <span className={state ? "label_ver" : "label_oculto"}>
                {label}
              </span>
            </section>
          </NavLink>
        </div>
      );
    });

  return (
    <Main $isopen={state.toString()}>
      <span className="Sidebarbutton" onClick={() => setState(!state)}>
        {<v.iconoflechaderecha />}
      </span>
      <Container $isopen={state.toString()} className={state ? "active" : ""}>
        <div className="Logocontent">
          <div className="imgcontent">
            <img src={v.logo} />
          </div>
          {/* <h2>Clínica de Salud Mental
              Dr. Gutierrez Walker</h2> */}
        </div>
        {renderLinks(primaryLinks)}
        <Divider />
        {renderLinks(secondaryLinks)}
        {/* <div className={state ? "LinkContainer active" : "LinkContainer"}>
          <div className="Links">
            <section className={state ? "content open" : "content"}>
              <Icon
                color="#CE82FF"
                className="Linkicon"
                icon="heroicons:ellipsis-horizontal-circle-solid"
              />
              <span className={state ? "label_ver" : "label_oculto"}>MÁS</span>
            </section>
          </div>
        </div> */}

        <ToggleTema />
      </Container>
    </Main>
  );
}
const Container = styled.div`
  background: ${({ theme }) => theme.bgtotal};
  color: ${(props) => props.theme.text};
  position: fixed;
  padding-top: 20px;
  z-index: 2;
  height: 100%;
  width: 88px;
  transition: 0.1s ease-in-out;
  overflow-y: auto;
  overflow-x: hidden;
  border-right: 2px solid ${({ theme }) => theme.color2};

  &::-webkit-scrollbar {
    width: 6px;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colorScroll};
    border-radius: 10px;
  }

  &.active {
    width: 200px;
  }
  .Logocontent {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 60px;
    .imgcontent {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 30px;
      cursor: pointer;
      transition: 0.3s ease;
      transform: ${({ $isopen }) =>
          $isopen === "true" ? `scale(0.7)` : `scale(1.5)`}
        rotate(${({ theme }) => theme.logorotate});
      img {
        width: 100%;
        animation: flotar 1.7s ease-in-out infinite alternate;
      }
    }
    h2 {
      color: var(--color-accent-strong);
      display: ${({ $isopen }) => ($isopen === "true" ? `block` : `none`)};
    }
  }
  .LinkContainer {
    margin: 9px 0;
    margin-right: 10px;
    margin-left: 8px;
    transition: all 0.3s ease-in-out;
    position: relative;
    text-transform: uppercase;
    font-weight: 500;
  }

  .Links {
    border-radius: 12px;
    display: flex;
    align-items: center;
    text-decoration: none;
    width: 100%;
    color: ${(props) => props.theme.text};
    height: 60px;
    position: relative;
    .content {
      display: flex;
      justify-content: center;
      width: 100%;
      align-items: center;
      .iconWrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .Linkicon {
        display: flex;
        font-size: 18px;

        svg {
          font-size: 28px;
        }
      }
      .badge {
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

      .label_ver {
        transition: 0.3s ease-in-out;
        opacity: 1;
        display: initial;
      }
      .label_oculto {
        opacity: 0;
        display: none;
      }

      &.open {
        justify-content: start;
        gap: 20px;
        padding: 1px;
      }
    }

    &:hover {
      background: ${(props) => props.theme.bgAlpha};
    }

    &.active {
      background: ${(props) => props.theme.bg6};
      border: 2px solid ${(props) => props.theme.bg5};
      color: ${(props) => props.theme.color1};
      font-weight: 500;
    }
  }

  @media (max-width: 767px) {
    .notificationLink {
      display: none;
    }
  }
`;
const Main = styled.div`
  .Sidebarbutton {
    position: fixed;
    top: 70px;
    left: 68px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${(props) => props.theme.bgtgderecha};
    box-shadow: 0 0 4px ${(props) => props.theme.bg3},
      0 0 7px ${(props) => props.theme.bg};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 3;
    transform: ${({ $isopen }) =>
      $isopen === "true" ? `translateX(173px) rotate(3.142rad)` : `initial`};
    color: ${(props) => props.theme.text};
  }

  @media (max-width: 767px) {
    .Sidebarbutton {
      display: none;
    }
  }

  @media (max-width: 767px) {
    top: var(--mobile-topbar-height, 62px);
    height: calc(100% - var(--mobile-topbar-height, 62px));
    z-index: 1001;
  }
`;
const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: ${(props) => props.theme.bg4};
  margin: ${() => v.lgSpacing} 0;
`;
