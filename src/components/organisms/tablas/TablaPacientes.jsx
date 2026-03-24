import styled from "styled-components";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Paginacion } from "../../../index";
import { Device, DeviceMax } from "../../../styles/breakpoints";

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
};

const formatConditionType = (value) => {
  if (!value) return "-";
  const raw = String(value).trim().toLowerCase();
  if (raw === "agudo") return "Agudo";
  if (raw === "cronico") return "Crónico";
  return value;
};

export function TablaPacientes({ data }) {
  const safeData = Array.isArray(data) ? data : [];
  const [sorting, setSorting] = useState([{ id: "last_name", desc: false }]);

  const columns = [
    {
      accessorKey: "document_number",
      header: "Documento",
      meta: {
        cardLabel: "Documento",
        cardValue: (row) =>
          row.id ? (
            <DocumentoLink to={`/paciente/${row.id}`}>{row.document_number ?? "-"}</DocumentoLink>
          ) : (
            row.document_number ?? "-"
          ),
      },
      cell: (info) => (
        <div data-title="Documento" className="ContentCell">
          {info.row.original?.id ? (
            <DocumentoLink to={`/paciente/${info.row.original.id}`}>
              {info.getValue() ?? "-"}
            </DocumentoLink>
          ) : (
            <span>{info.getValue() ?? "-"}</span>
          )}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "first_name",
      header: "Nombre",
      meta: {
        cardLabel: "Nombre",
        cardValue: (row) => row.first_name ?? "-",
      },
      cell: (info) => (
        <div data-title="Nombre" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "last_name",
      header: "Apellido",
      meta: {
        cardLabel: "Apellido",
        cardValue: (row) => row.last_name ?? "-",
      },
      cell: (info) => (
        <div data-title="Apellido" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "admission_at",
      header: "Dia de ingreso",
      meta: {
        cardLabel: "Dia de ingreso",
        cardValue: (row) => formatDate(row.admission_at),
      },
      cell: (info) => (
        <div data-title="Dia de ingreso" className="ContentCell">
          <span>{formatDate(info.getValue())}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "condition_type",
      header: "Condicion",
      meta: {
        cardLabel: "Condicion",
        cardValue: (row) => formatConditionType(row.condition_type),
      },
      cell: (info) => (
        <div data-title="Condicion" className="ContentCell">
          <span>{formatConditionType(info.getValue())}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "admission_diagnosis",
      header: "Diagnostico",
      meta: {
        cardLabel: "Diagnostico",
        cardValue: (row) => row.admission_diagnosis ?? "-",
      },
      cell: (info) => (
        <div data-title="Diagnostico" className="ContentCell diagnosis">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
    },
  ];

  const table = useReactTable({
    data: safeData,
    columns,
    state: { sorting },
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
          const paciente = row.original;
          const cardFields = columns
            .map((column) => ({
              key: column.accessorKey,
              label: column.meta?.cardLabel,
              value: column.meta?.cardValue?.(paciente),
            }))
            .filter(
              (field) =>
                field.label &&
                field.key !== "first_name" &&
                field.key !== "last_name"
            );

          return (
            <article className="card" key={row.id}>
              <div className="cardHeader">
                <h3>
                  {paciente.id ? (
                    <DocumentoLink to={`/paciente/${paciente.id}`}>
                      {paciente.last_name ?? "-"}, {paciente.first_name ?? "-"}
                    </DocumentoLink>
                  ) : (
                    <span>
                      {paciente.last_name ?? "-"}, {paciente.first_name ?? "-"}
                    </span>
                  )}
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
            </article>
          );
        })}
      </div>

      <div className="tableScroll">
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
                              ? (event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    header.column.getToggleSortingHandler()?.(event);
                                  }
                                }
                              : undefined
                          }
                        >
                          <span className="thLabel">{header.column.columnDef.header}</span>
                          {canSort && (
                            <span className={`sortIcon ${sorted ? "sorted" : ""}`}>
                              {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : ""}
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
      </div>
      <Paginacion table={table} />
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  width: 100%;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media ${Device.tablet} {
    min-height: clamp(340px, 50vh, 560px);
  }

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
    align-items: flex-start;

    .label {
      color: ${({ theme }) => theme.textsecundary};
      flex: 1;
      min-width: 0;
    }

    .value {
      color: ${({ theme }) => theme.text};
      font-weight: 600;
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
  }

  .tableScroll {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    @media ${Device.tablet} {
      flex: 1;
    }
  }

  .responsive-table {
    width: 100%;
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
      }

      .ContentCell {
        //text-align: right;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 50px;
        border-bottom: 1px solid var(--border-subtle);

        @media ${Device.tablet} {
          justify-content: center;
          border-bottom: none;
        }
      }

      .ContentCell.diagnosis span {
        display: block;
        width: 100%;
        max-width: none;
        text-align: center;
        overflow-wrap: anywhere;
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

const DocumentoLink = styled(Link)`
  color: ${({ theme }) => theme.text};
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 700;

  &:hover {
    color: ${({ theme }) => theme.color1};
  }
`;
