import styled from "styled-components";
import { AccionTabla, Paginacion } from "../../../index";
import { v } from "../../../styles/variables";
import { Device, DeviceMax } from "../../../styles/breakpoints";
import { useState } from "react";
import { usePermissions } from "../../../hooks/usePermissions";
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

export function TablaVacaciones({ data, onEdit, onDelete }) {
  const safeData = data ?? [];
  const [columnFilters] = useState([]);
  const [sorting, setSorting] = useState([{ id: "start_date", desc: true }]);
  
  // Hook de permisos
  const { canUpdate, canDelete } = usePermissions();

  const columns = [
    {
      accessorKey: "start_date",
      header: "Desde",
      meta: {
        cardLabel: "Desde",
        cardValue: (row) => formatDate(row.start_date),
      },
      cell: (info) => (
        <div data-title="Desde" className="ContentCell">
          <span>{formatDate(info.getValue())}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "end_date",
      header: "Hasta",
      meta: {
        cardLabel: "Hasta",
        cardValue: (row) => formatDate(row.end_date),
      },
      cell: (info) => (
        <div data-title="Hasta" className="ContentCell">
          <span>{formatDate(info.getValue())}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "days_taken",
      header: "Dias",
      meta: {
        cardLabel: "Dias",
        cardValue: (row) => row.days_taken ?? 0,
      },
      cell: (info) => (
        <div data-title="Dias" className="ContentCell">
          <span>{info.getValue() ?? 0}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "Estado de aprobacion",
      meta: {
        cardLabel: "Estado de aprobacion",
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
          {canUpdate('vacaciones') && (
            <AccionTabla
              funcion={() => onEdit?.(info.row.original)}
              fontSize="18px"
              color="#7d7d7d"
              icono={<v.iconeditarTabla />}
            />
          )}
          {canDelete('vacaciones') && (
            <AccionTabla
              funcion={() => onDelete?.(info.row.original)}
              fontSize="18px"
              color={v.rojo}
              icono={<v.iconeliminarTabla />}
            />
          )}
        </div>
      ),
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data: safeData,
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

  if (data == null) return null;

  return (
    <Container>
      <div className="cards">
        {table.getRowModel().rows.map((row) => {
          const vacacion = row.original;
          const cardFields = columns
            .filter((column) => column.meta?.cardLabel)
            .map((column) => ({
              label: column.meta?.cardLabel,
              value: column.meta?.cardValue?.(vacacion),
            }));
          return (
            <article className="card" key={row.id}>
              <div className="cardHeader">
                <h3>
                  {formatDate(vacacion.start_date)} -{" "}
                  {formatDate(vacacion.end_date)}
                </h3>
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
                <button type="button" onClick={() => onEdit?.(vacacion)}>
                  Editar
                </button>
                <button type="button" onClick={() => onDelete?.(vacacion)}>
                  Eliminar
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
      background: var(--bg-accent-soft-strong);
      color: ${({ theme }) => theme.color1};
    }
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
