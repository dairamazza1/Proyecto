import styled from "styled-components";
import { Link } from "react-router-dom";
import { Device } from "../../styles/breakpoints";

export function HomeCards({ cards = [] }) {
  return (
    <Grid>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.to} to={card.to}>
            <div className="icon">{Icon && <Icon />}</div>
            <div className="content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          </Card>
        );
      })}
    </Grid>
  );
}

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;

  @media ${Device.tablet} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media ${Device.desktop} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const Card = styled(Link)`
  text-decoration: none;
  color: inherit;
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 18px 20px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: center;
  transition: transform 160ms ease, box-shadow 160ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.12);
  }

  .icon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: ${({ theme }) => theme.bgAlpha};
    color: ${({ theme }) => theme.color1};
    font-size: 24px;
  }

  .content {
    display: grid;
    gap: 6px;

    h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
    }

    p {
      margin: 0;
      color: ${({ theme }) => theme.textsecundary};
      font-weight: 500;
    }
  }
`;
