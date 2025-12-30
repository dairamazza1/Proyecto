import styled from "styled-components";
import { AccionTabla, Paginacion } from "../../../index";
import { v } from "../../../styles/variables";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

const statusValues = {
  rejected: "Rechazado",
  approved: "Aprobado",
  pending: "Pendiente",
};

const formatStatus = (value) =>
  statusValues[String(value ?? "").toLowerCase()] ?? "-";

export function TablaCambios({ data, onEdit }) {
  if (data == null) return null;
  const [columnFilters] = useState([]);
  const [sorting, setSorting] = useState([
    { id: "effective_date", desc: true },
  ]);

  const columns = [
    {
      accessorKey: "effective_date",
      header: "Fecha",
      meta: {
        cardLabel: "Fecha",
        cardValue: (row) => formatDate(row.effective_date),
      },
      cell: (info) => (
        <div data-title="Fecha" className="ContentCell">
          <span>{formatDate(info.getValue())}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "previous_schedule",
      header: "Horario anterior",
      meta: {
        cardLabel: "Horario anterior",
        cardValue: (row) => row.previous_schedule ?? "-",
      },
      cell: (info) => (
        <div data-title="Horario anterior" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "new_schedule",
      header: "Horario nuevo",
      meta: {
        cardLabel: "Horario nuevo",
        cardValue: (row) => row.new_schedule ?? "-",
      },
      cell: (info) => (
        <div data-title="Horario nuevo" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "Estado",
      meta: {
        cardLabel: "Estado",
        cardValue: (row) => formatStatus(row.status),
      },
      cell: (info) => (
        <div data-title="Estado" className="ContentCell">
          <span>{formatStatus(info.getValue())}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: (info) => (
        <div data-title="Acciones" className="ContentCell">
          <AccionTabla
            funcion={() => onEdit?.(info.row.original)}
            fontSize="18px"
            color="#7d7d7d"
            icono={<v.iconeditarTabla />}
          />
        </div>
      ),
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
  });

  return (
    <Container>
      <div className="cards">
        {table.getRowModel().rows.map((row) => {
          const cambio = row.original;
          const cardFields = columns
            .filter((column) => column.meta?.cardLabel)
            .map((column) => ({
              label: column.meta?.cardLabel,
              value: column.meta?.cardValue?.(cambio),
            }));
          return (
            <article className="card" key={row.id}>
              <div className="cardHeader">
                <h3>{formatDate(cambio.effective_date)}</h3>
              </div>
              <div className="cardBody">
                {cardFields.map((field) => (
                  <div className="cardRow" key={field.label}>
                    <span className="label">{field.label}</span>
                    <span className="value">{field.value}</span>
                  </div>
                ))}
              </div>
              <div className="cardActions">
                <button type="button" onClick={() => onEdit?.(cambio)}>
                  Editar
                </button>
              </div>
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
                            ? "▲"
                            : sorted === "desc"
                            ? "▼"
                            : ""}
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
          {table.getRowModel().rows.map((item) => (
            <tr key={item.id}>
              {item.getVisibleCells().map((cell) => (
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

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

const Container = styled.div`
  position: relative;
  width: 100%;
  overflow-x: hidden;

  .cards {
    display: grid;
    gap: 14px;
    margin-bottom: 1.5em;
    width: 100%;

    @media (min-width: ${v.bpbart}) {
      display: none;
    }
  }

  .card {
    background: ${({ theme }) => theme.bgtotal};
    border-radius: 14px;
    padding: 14px 16px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    display: grid;
    gap: 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .cardHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: ${({ theme }) => theme.text};
      max-width: 100%;
      word-break: break-word;
    }
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
    flex-wrap: wrap;

    .label {
      color: ${({ theme }) => theme.textsecundary};
    }

    .value {
      color: ${({ theme }) => theme.text};
      font-weight: 600;
      max-width: 100%;
      word-break: break-word;
      text-align: right;
    }
  }

  .cardActions {
    display: flex;
    justify-content: flex-end;

    button {
      border: none;
      border-radius: 999px;
      padding: 6px 14px;
      font-weight: 600;
      cursor: pointer;
      background: rgba(31, 141, 255, 0.15);
      color: ${({ theme }) => theme.color1};
    }
  }

  .responsive-table {
    width: 100%;
    margin-bottom: 1.5em;
    border-spacing: 0;

    @media (max-width: ${v.bpbart}) {
      display: none;
    }

    thead {
      position: absolute;
      padding: 0;
      border: 0;
      height: 1px;
      width: 1px;
      overflow: hidden;

      @media (min-width: ${v.bpbart}) {
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

      .thLabel {
        display: inline-block;
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
      @media (min-width: ${v.bpbart}) {
        display: table-row;
      }
    }

    th,
    td {
      padding: 0.5em;
      vertical-align: middle;
      @media (min-width: ${v.bplisa}) {
        padding: 0.75em 0.5em;
      }
      @media (min-width: ${v.bpbart}) {
        display: table-cell;
        padding: 0.5em;
      }
      @media (min-width: ${v.bpmarge}) {
        padding: 0.75em 0.5em;
      }
      @media (min-width: ${v.bphomer}) {
        padding: 0.75em;
      }
    }

    tbody {
      @media (min-width: ${v.bpbart}) {
        display: table-row-group;
      }
      tr {
        margin-bottom: 1em;
        @media (min-width: ${v.bpbart}) {
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
        border-bottom: 1px solid rgba(161, 161, 161, 0.32);
        @media (min-width: ${v.bpbart}) {
          justify-content: center;
          border-bottom: none;
        }
      }

      td {
        text-align: right;
        @media (min-width: ${v.bpbart}) {
          text-align: center;
        }
      }

      td[data-title]:before {
        content: attr(data-title);
        float: left;
        font-size: 0.8em;
        @media (min-width: ${v.bplisa}) {
          font-size: 0.9em;
        }
        @media (min-width: ${v.bpbart}) {
          content: none;
        }
      }
    }
  }
`;
