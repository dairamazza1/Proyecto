import styled from "styled-components";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Btn1, InputText2, Spinner1, Title, v } from "../../index";
import { fetchPokemonViaEdge } from "../../supabase/edgePokeapi.jsx";

export function PokePruebasTemplate() {
  const [input, setInput] = useState("pikachu");
  const [selected, setSelected] = useState("pikachu");

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["pokeapi-edge", selected],
    queryFn: () => fetchPokemonViaEdge({ pokemon: selected }),
    enabled: Boolean(selected),
    refetchOnWindowFocus: false,
  });

  const sprite = useMemo(() => {
    return data?.sprites?.official || data?.sprites?.front_default || null;
  }, [data]);

  const handleSearch = () => setSelected(input.trim().toLowerCase());

  return (
    <Container>
      <Header>
        <div>
          <Title>Pruebas — PokeAPI (Edge Function)</Title>
          <p>Busca por nombre o id (ej: pikachu, 25, charizard).</p>
        </div>

        <Controls>
          <InputText2>
            <input
              className="form__field"
              placeholder="pikachu o 25"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === "Enter" ? handleSearch() : null)}
            />
          </InputText2>

          <Btn1
            tipo="button"
            funcion={handleSearch}
            titulo={isFetching ? "BUSCANDO..." : "BUSCAR"}
            bgcolor={v.colorPrincipal}
            disabled={!input.trim() || isFetching}
          />
        </Controls>
      </Header>

      {isLoading ? (
        <SpinnerWrap>
          <Spinner1 />
        </SpinnerWrap>
      ) : error ? (
        <ErrorBox>
          <strong>Error:</strong> {error?.message || "No se pudo cargar"}
        </ErrorBox>
      ) : data ? (
        <Card>
          <div className="top">
            <div className="text">
              <h3>
                #{data.id} — {data.name}
              </h3>
              <small>
                height: {data.height} | weight: {data.weight}
              </small>
            </div>
            {sprite ? <img src={sprite} alt={data.name} /> : null}
          </div>

          <div className="row">
            <div>
              <h4>Tipos</h4>
              <ul>{(data.types || []).map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div>
              <h4>Habilidades</h4>
              <ul>
                {(data.abilities || []).map((a) => <li key={a}>{a}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      ) : null}
    </Container>
  );
}

const Container = styled.div`
  min-height: calc(100dvh - 30px);
  padding: 24px;
  display: grid;
  gap: 18px;
  background: ${({ theme }) => theme.bgtotal};
`;

const Header = styled.header`
  display: grid;
  gap: 12px;

  p {
    margin: 0;
    color: ${({ theme }) => theme.textsecundary};
    font-weight: 500;
  }
`;

const Controls = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;

  @media (min-width: 900px) {
    grid-template-columns: 420px auto;
    align-items: start;
  }
`;

const Card = styled.section`
  background: ${({ theme }) => theme.bg};
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 18px;
  padding: 18px;
  box-shadow: var(--shadow-elev-1);
  display: grid;
  gap: 16px;

  .top {
    display: grid;
    gap: 12px;

    @media (min-width: 900px) {
      grid-template-columns: 1fr auto;
      align-items: center;
    }

    img {
      width: 160px;
      height: 160px;
      object-fit: contain;
      background: ${({ theme }) => theme.bgAlpha};
      border-radius: 16px;
      padding: 10px;
    }
  }

  h3 {
    margin: 0;
  }

  small {
    color: ${({ theme }) => theme.textsecundary};
    font-weight: 600;
  }

  .row {
    display: grid;
    gap: 14px;

    @media (min-width: 900px) {
      grid-template-columns: 1fr 1fr;
    }

    h4 {
      margin: 0 0 8px 0;
    }

    ul {
      margin: 0;
      padding-left: 18px;
      color: ${({ theme }) => theme.textsecundary};
      font-weight: 600;
    }
  }
`;

const SpinnerWrap = styled.div`
  padding: 20px 0;
`;

const ErrorBox = styled.div`
  background: var(--bg-danger-soft);
  border: 1px solid var(--color-danger);
  border-radius: 14px;
  padding: 14px 16px;
  color: ${({ theme }) => theme.text};
`;