import styled, { ThemeProvider } from "styled-components";
import {
  AuthContextProvider,
  GlobalStyles,
  MyRoutes,
  Sidebar,
  useThemeStore,
  Login,
} from "./index";
import { Device } from "./styles/breakpoints";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { themeStyle } = useThemeStore();
  const { pathname } = useLocation();

  return (
    <ThemeProvider theme={themeStyle}>
      <AuthContextProvider>
         <GlobalStyles />
        {pathname !== "/login" && pathname !== "/register" ? (
          <Container className={sidebarOpen ? "active" : ""}>
           
            <section className="contentSidebar">
              <Sidebar
                state={sidebarOpen}
                setState={() => setSidebarOpen(!sidebarOpen)}
              />
            </section>

            <section className="contentHambur">menuHambur</section>

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
  display: grid;
  grid-template-columns: 1fr;
  transition: 0.1s ease-in-out;
  color: ${({ theme }) => theme.text};
  //mobile
  .contentSidebar {
    display: none;
    /* background-color: red; */
  }
  .contentHambur {
    position: absolute;
    /* background-color: blue; */
  }
  .contentRouters {
    /* background-color: rgb(86, 137, 99); */
    grid-column: 1;
    width: 100%;
  }

  @media ${Device.tablet} {
    grid-template-columns: 88px 1fr;
    &.active {
      grid-template-columns: 260px 1fr;
    }
    .contentSidebar {
      display: initial;
    }
    .contentHambur {
      display: none;
    }
    .contentRouters {
      grid-column: 2;
    }
  }
`;
export default App;
