import styled from "styled-components";
import {
  Title,
  InputText2,
  Btn1,
  Footer,
  useAuthStore,
  Linea,
} from "../../index";
import { v } from "../../styles/variables";
import { Device } from "../../styles/breakpoints";

export function LoginTemplate() {
  const { loginGoogle } = useAuthStore();

  return (
    <Container>
      <div className="card">
        <ContentLogo>
          <img src={v.logo} alt="409px" />
          <span>Proyecto de prueba</span>
        </ContentLogo>
        <Title $paddingbottom="20px">Ingresar</Title>
        <form>
          <InputText2>
            <input className="form__field" placeholder="Usuario" type="text" />
          </InputText2>
          <InputText2>
            <input
              className="form__field"
              placeholder="Contraseña"
              type="password"
            />
          </InputText2>
          <Btn1
            tipo="submit"
            titulo="INGRESAR"
            bgcolor="rgb(143, 191, 250)"
            color="255,255,2555"
            width="100%"
          />
          <Linea>
            <span>o</span>
          </Linea>
          <Btn1
            tipo="button"
            funcion={loginGoogle}
            titulo="Google"
            bgcolor="rgb(255, 255, 255)"
            icono={<v.iconogoogle />}
            width="100%"
          />
        </form>
      </div>
      <Footer />
    </Container>
  );
}
const Container = styled.div`
  height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex-direction: column;
  padding: 0 10px;

  color: ${({ theme }) => theme.text};
  .card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    width: 100%;
    margin: 20px;
    @media ${Device.tablet} {
      width: 400px;
    }
  }
`;
const ContentLogo = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px;
  span {
    font-weight: 700;
  }
  img {
    width: 10%;
  }
`;
