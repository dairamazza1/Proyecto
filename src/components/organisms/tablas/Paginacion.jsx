import React, { useState } from "react";
import { v } from "../../../styles/variables";
import styled from "styled-components";
import { Btn1 } from "../../../index";
export const Paginacion = ({ table }) => {


  return (
    <Container>
      <Btn1
        disabled={!table.getCanPreviousPage()}
        funcion={() => table.setPageIndex(0)}
        bgcolor="#F3D20C"
        icono={<v.iconotodos />}
      />

      <Btn1
        disabled={!table.getCanPreviousPage()}
        funcion={() => table.previousPage()}
        bgcolor="#F3D20C"
        icono={<v.iconoflechaizquierda />}
      />

      <span className="pageIndex">{table.getState().pagination.pageIndex + 1}</span>
      <p className="pageCount">de {table.getPageCount()}</p>

      <Btn1
        disabled={!table.getCanNextPage()}
        funcion={() => table.nextPage()}
        bgcolor="#F3D20C"
        icono={<v.iconoflechaderecha />}
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

  @media (max-width: ${v.bplisa}) {
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

    .pageIndex,
    .pageCount {
      font-size: 0.95rem;
    }
  }

`;
