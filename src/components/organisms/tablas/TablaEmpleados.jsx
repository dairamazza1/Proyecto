import styled from "styled-components";
import { Paginacion, Icono } from "../../../index";
import { v } from "../../../styles/variables";
import { Device, DeviceMax } from "../../../styles/breakpoints";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Link } from "react-router-dom";

export function TablaEmpleados({ data }) {
  if (data == null) return null;
  const [columnFilters] = useState([]);
  const [sorting, setSorting] = useState([{ id: "last_name", desc: false }]);

  const columns = [
    {
      accessorKey: "employee_id_number",
      header: "Nro Legajo",
      meta: {
        cardLabel: "Legajo",
        cardValue: (row) =>
          row.employee_id_number ?? row.document_number ?? row.id ?? "-",
      },
      cell: (info) => (
        <div data-title="Nro Legajo" className="ContentCell">
          <AccederLink
            to={`/empleados/${info.row.original.id}`}
            title="Acceder a empleado"
            aria-label={`Acceder a empleado ${
              info.row.original.employee_id_number ??
              info.row.original.document_number ??
              info.row.original.id
            }`}
          >
            <span className="legajoValue">
              {info.row.original.employee_id_number ??
                info.row.original.document_number ??
                info.row.original.id}
            </span>
          </AccederLink>
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
      id: "puesto",
      accessorFn: (row) => row.puesto?.name ?? "",
      header: "Puesto",
      meta: {
        cardLabel: "Puesto",
        cardValue: (row) => row.puesto?.name ?? "-",
      },
      cell: (info) => (
        <div data-title="Puesto" className="ContentCell">
          <span>{info.row.original.puesto?.name ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "professional_number",
      header: "Matricula",
      meta: {
        cardLabel: "Matricula",
        cardValue: (row) => row.professional_number || "-",
      },
      cell: (info) => (
        <div data-title="Matricula" className="ContentCell">
          <span>{info.getValue() || "-"}</span>
        </div>
      ),
      enableSorting: true,
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
          const empleado = row.original;
          const cardFields = columns
            .map((column) => ({
              label: column.meta?.cardLabel,
              value: column.meta?.cardValue?.(empleado),
            }))
            .filter((field) => field.label);
          return (
            <CardLink
              to={`/empleados/${empleado.id}`}
              key={row.id}
              aria-label={`Acceder a empleado ${empleado.last_name ?? ""} ${
                empleado.first_name ?? ""
              }`}
            >
              <article className="card">
                <div className="cardHeader">
                  <h3>
                    {empleado.last_name ?? "-"}, {empleado.first_name ?? "-"}
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
            </CardLink>
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

const Container = styled.div`
  position: relative;

  margin: 5% 3%;
  @media ${Device.tablet} {
    margin: 2%;
  }
  @media ${Device.desktop} {
    margin: 2em auto;
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
    background: ${({ theme }) => theme.bgtotal};
    border-radius: 14px;
    padding: 14px 16px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    display: grid;
    gap: 12px;
  }

  .cardHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: ${({ theme }) => theme.text};
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

    .label {
      color: ${({ theme }) => theme.textsecundary};
    }

    .value {
      color: ${({ theme }) => theme.text};
      font-weight: 600;
    }
  }

  .cardLink {
    text-decoration: none;
    color: inherit;
  }

  .responsive-table {
    width: 100%;
    margin-bottom: 1.5em;
    border-spacing: 0;

    @media ${DeviceMax.tablet} {
      display: none;
    }

    @media ${Device.tablet} {
      font-size: 0.9em;
    }
    @media ${Device.laptop} {
      font-size: 1em;
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
        border-bottom: 1px solid rgba(161, 161, 161, 0.32);
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

const AccederLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.text};
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 700;

  &:hover {
    color: ${({ theme }) => theme.color1};
  }

  .legajoValue {
    letter-spacing: 0.2px;
  }
`;

const CardLink = styled(Link)`
  text-decoration: none;
  color: inherit;

  &:hover .card {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.12);
  }
`;
