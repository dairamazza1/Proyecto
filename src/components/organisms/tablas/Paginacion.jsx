import { v } from "../../../styles/variables";
import { DeviceMax } from "../../../styles/breakpoints";
import styled from "styled-components";
import { Btn1 } from "../../../index";

export const Paginacion = ({ table }) => {
  return (
    <Container>
      <Btn1
        tipo="button"
        disabled={!table.getCanPreviousPage()}
        funcion={() => table.setPageIndex(0)}
        bgcolor={v.colorPrincipal}
        icono={<v.iconotodos />}
        titulo="Inicio"
      />

      <Btn1
        tipo="button"
        disabled={!table.getCanPreviousPage()}
        funcion={() => table.previousPage()}
        bgcolor={v.colorPrincipal}
        icono={<v.iconoflechaizquierda />}
        titulo="Anterior"
      />

      <span className="pageIndex">
        {table.getState().pagination.pageIndex + 1}
      </span>
      <p className="pageCount">de {table.getPageCount()}</p>

      <Btn1
        tipo="button"
        disabled={!table.getCanNextPage()}
        funcion={() => table.nextPage()}
        bgcolor={v.colorPrincipal}
        icono={<v.iconoflechaderecha />}
        titulo="Siguiente"
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  .pageIndex,
  .pageCount {
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }

  .pageCount {
    margin: 0;
  }

  @media ${DeviceMax.mobile} {
    gap: 8px;

    button {
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 14px;
    }

    button .content {
      gap: 6px;
    }

    button span {
      font-size: 16px;
    }

    button .btn {
      display: none;
    }

    .pageIndex,
    .pageCount {
      font-size: 0.95rem;
    }
  }

`;
