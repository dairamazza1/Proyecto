import styled from "styled-components";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Device, DeviceMax } from "../../../styles/breakpoints";
import { Paginacion } from "../../../index";

export function ReportesTable({
  data = [],
  columns = [],
  getCardTitle,
  renderCardActions,
}) {
  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Container>
      <div className="cards">
        {table.getRowModel().rows.map((row) => {
          const item = row.original;
          const cardTitle = getCardTitle?.(item) || "Registro";
          const cardFields = columns
            .map((column) => ({
              label: column.meta?.cardLabel,
              value: column.meta?.cardValue?.(item),
            }))
            .filter((field) => field.label);

          const cardActions = renderCardActions?.(item);

          return (
            <article className="card" key={row.id}>
              <div className="cardHeader">
                <h3>{cardTitle}</h3>
              </div>
              <div className="cardBody">
                {cardFields.map((field) => (
                  <div className="cardRow" key={field.label}>
                    <span className="label">{field.label}</span>
                    <span className="value">{field.value}</span>
                  </div>
                ))}
              </div>
              {cardActions ? (
                <div className="cardActions">{cardActions}</div>
              ) : null}
            </article>
          );
        })}
      </div>

      <table className="responsive-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();

                return (
                  <th key={header.id}>
                    <div
                      className={canSort ? "thInner sortable" : "thInner"}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      role={canSort ? "button" : undefined}
                      tabIndex={canSort ? 0 : undefined}
                      onKeyDown={
                        canSort
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                header.column.getToggleSortingHandler()?.(e);
                              }
                            }
                          : undefined
                      }
                    >
                      <span className="thLabel">
                        {header.column.columnDef.header}
                      </span>
                      {canSort && (
                        <span className={`sortIcon ${sorted ? "sorted" : ""}`}>
                          {sorted === "asc"
                            ? " ▲"
                            : sorted === "desc"
                            ? " ▼"
                            : ""
                            
                            }
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Paginacion table={table} />
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  width: 100%;

  .cards {
    display: grid;
    gap: 14px;
    margin-bottom: 1.5em;

    @media ${Device.tablet} {
      display: none;
    }
  }

  .card {
    background: ${({ theme }) => theme.bg};
    border-radius: 14px;
    padding: 14px 16px;
    box-shadow: var(--shadow-elev-1);
    display: grid;
    gap: 12px;
  }

  .cardHeader h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: ${({ theme }) => theme.text};
  }

  .cardBody {
    display: grid;
    gap: 8px;
  }

  .cardRow {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 0.95rem;

    .label {
      color: ${({ theme }) => theme.textsecundary};
    }

    .value {
      color: ${({ theme }) => theme.text};
      font-weight: 600;
      text-align: right;
    }
  }

  .cardActions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .responsive-table {
    width: 100%;
    margin-bottom: 1.5em;
    border-spacing: 0;

    @media ${DeviceMax.tablet} {
      display: none;
    }

    thead {
      position: absolute;
      padding: 0;
      border: 0;
      height: 1px;
      width: 1px;
      overflow: hidden;

      @media ${Device.tablet} {
        position: relative;
        height: auto;
        width: auto;
        overflow: auto;
      }

      th {
        border-bottom: 2px solid ${({ theme }) => theme.color2};
        font-weight: 700;
        text-align: center;
        color: ${({ theme }) => theme.text};
      }

      .thInner {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        user-select: none;
      }

      .sortable {
        cursor: pointer;
      }

      .sortIcon {
        font-size: 0.9em;
        opacity: 0.8;
        transform: translateY(-1px);
        transition: opacity 120ms ease, transform 120ms ease;
      }

      .sortIcon.sorted {
        opacity: 1;
        transform: translateY(0px);
      }
    }

    tbody,
    tr,
    th,
    td {
      display: block;
      padding: 0;
      text-align: left;
      white-space: normal;
    }

    tr {
      @media ${Device.tablet} {
        display: table-row;
      }
    }

    th,
    td {
      padding: 0.5em;
      vertical-align: middle;
      @media ${Device.mobile} {
        padding: 0.75em 0.5em;
      }
      @media ${Device.tablet} {
        display: table-cell;
        padding: 0.5em;
      }
      @media ${Device.laptop} {
        padding: 0.75em 0.5em;
      }
      @media ${Device.desktop} {
        padding: 0.75em;
      }
    }

    tbody {
      @media ${Device.tablet} {
        display: table-row-group;
      }
      tr {
        margin-bottom: 1em;
        @media ${Device.tablet} {
          display: table-row;
          border-width: 1px;
        }
        &:last-of-type {
          margin-bottom: 0;
        }
      }

      .ContentCell {
        text-align: right;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 50px;
        border-bottom: 1px solid var(--border-subtle);
        @media ${Device.tablet} {
          justify-content: center;
          border-bottom: none;
        }
      }

      .ContentCell.acciones {
        gap: 10px;
        justify-content: flex-end;
        @media ${Device.tablet} {
          justify-content: center;
        }
      }

      td {
        text-align: right;
        @media ${Device.tablet} {
          text-align: center;
        }
      }

      td[data-title]:before {
        content: attr(data-title);
        float: left;
        font-size: 0.8em;
        @media ${Device.mobile} {
          font-size: 0.9em;
        }
        @media ${Device.tablet} {
          content: none;
        }
      }
    }
  }
`;
