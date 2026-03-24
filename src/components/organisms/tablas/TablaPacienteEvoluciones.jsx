import styled from "styled-components";
import { useState } from "react";
import {
  AccionTabla,
  Paginacion,
  resolvePerfilDisplayName,
  resolvePerfilRoleDisplay,
} from "../../../index";
import { v } from "../../../styles/variables";
import { Device, DeviceMax } from "../../../styles/breakpoints";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

const DETAIL_MAX = 60;

const normalizeText = (value) => String(value ?? "").trim();

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()} ${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`;
};

const getResponsableLabel = (row) =>
  resolvePerfilDisplayName(row?.creador, row?.created_by);

const getRoleLabel = (row) => resolvePerfilRoleDisplay(row?.creador);

export function TablaPacienteEvoluciones({
  data,
  onEdit,
  canEditRow = () => false,
}) {
  const safeData = data ?? [];
  const [columnFilters] = useState([]);
  const [sorting, setSorting] = useState([{ id: "evolution_at", desc: true }]);
  const [previewRecord, setPreviewRecord] = useState(null);

  const columns = [
    {
      accessorKey: "evolution_at",
      header: "Fecha y hora",
      meta: {
        cardLabel: "Fecha y hora",
        cardValue: (row) => formatDateTime(row.evolution_at),
      },
      cell: (info) => (
        <div data-title="Fecha y hora" className="ContentCell">
          <span>{formatDateTime(info.getValue())}</span>
        </div>
      ),
      enableSorting: true,
      sortingFn: "datetime",
    },
    {
      accessorKey: "notes",
      header: "Notas",
      meta: {
        cardLabel: "Notas",
        cardValue: (row) => row.notes ?? "-",
      },
      cell: (info) => {
        const row = info.row.original;
        const detail = normalizeText(row?.notes);
        const text = detail || "-";
        const isTruncated = detail.length > DETAIL_MAX;
        const truncated = isTruncated
          ? `${detail.slice(0, DETAIL_MAX).trim()}...`
          : text;
        return (
          <div data-title="Notas" className="ContentCell detailCell">
            <div className="detailInline">
              <button
                type="button"
                className={`detailButton${isTruncated ? " truncated" : ""}`}
                title={text}
                onClick={() => setPreviewRecord(row)}
              >
                <span className="detailText">{truncated}</span>
              </button>
              {isTruncated ? (
                <button
                  type="button"
                  className="detailMore"
                  onClick={() => setPreviewRecord(row)}
                >
                  ver mas
                </button>
              ) : null}
            </div>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      id: "responsable",
      header: "Registrado por",
      accessorFn: (row) => getResponsableLabel(row),
      meta: {
        cardLabel: "Registrado por",
        cardValue: (row) => getResponsableLabel(row),
      },
      cell: (info) => (
        <div data-title="Registrado por" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "role",
      header: "Rol / puesto",
      accessorFn: (row) => getRoleLabel(row),
      meta: {
        cardLabel: "Rol / puesto",
        cardValue: (row) => getRoleLabel(row),
      },
      cell: (info) => (
        <div data-title="Rol / puesto" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: (info) => {
        const row = info.row.original;
        return (
          <div data-title="Acciones" className="ContentCell actionsCell">
            <AccionTabla
              funcion={() => setPreviewRecord(row)}
              fontSize="18px"
              color={v.colorPrincipal}
              icono={<v.iconoEye />}
            />
            {canEditRow(row) ? (
              <AccionTabla
                funcion={() => onEdit?.(row)}
                fontSize="18px"
                color="#7d7d7d"
                icono={<v.iconeditarTabla />}
              />
            ) : null}
          </div>
        );
      },
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data: safeData,
    columns,
    initialState: {
      pagination: { pageSize: 25 },
    },
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
          const evolucion = row.original;
          const cardFields = columns
            .filter((column) => column.meta?.cardLabel)
            .map((column) => ({
              label: column.meta?.cardLabel,
              value: column.meta?.cardValue?.(evolucion),
            }));

          return (
            <article className="card" key={row.id}>
              <div className="cardHeader">
                <h3>{formatDateTime(evolucion.evolution_at)}</h3>
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
                <button type="button" onClick={() => setPreviewRecord(evolucion)}>
                  Ver detalle
                </button>
                {canEditRow(evolucion) ? (
                  <button type="button" onClick={() => onEdit?.(evolucion)}>
                    Editar
                  </button>
                ) : null}
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
                        <span className="thLabel">
                          {header.column.columnDef.header}
                        </span>
                        {canSort ? (
                          <span className={`sortIcon ${sorted ? "sorted" : ""}`}>
                            {sorted === "asc" ? "^" : sorted === "desc" ? "v" : ""}
                          </span>
                        ) : null}
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
      </div>
      <Paginacion table={table} />

      {previewRecord ? (
        <PreviewOverlay
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewRecord(null);
            }
          }}
        >
          <PreviewCard>
            <div className="previewHeader">
              <h3>Detalle de la evolucion</h3>
              <button type="button" onClick={() => setPreviewRecord(null)}>
                x
              </button>
            </div>
            <div className="previewMeta">
              <span>Fecha y hora: {formatDateTime(previewRecord.evolution_at)}</span>
              <span>Registrado por: {getResponsableLabel(previewRecord)}</span>
              <span>Rol / puesto: {getRoleLabel(previewRecord)}</span>
            </div>
            <p className="previewDetails">{previewRecord.notes ?? "-"}</p>
          </PreviewCard>
        </PreviewOverlay>
      ) : null}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  width: 100%;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;

  .cards {
    display: grid;
    gap: 14px;
    margin-bottom: 1.5em;
    width: 100%;
    max-height: clamp(280px, 60vh, 640px);
    overflow-y: auto;
    padding-right: 6px;

    @media ${Device.tablet} {
      display: none;
    }
  }

  .card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
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
      overflow-wrap: anywhere;
      white-space: normal;
      text-align: right;
    }
  }

  .cardActions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;

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

      .ContentCell.detailCell {
        justify-content: center;
        text-align: center;
      }

      .actionsCell {
        gap: 10px;
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

  .detailButton {
    border: none;
    background: transparent;
    padding: 0;
    color: inherit;
    font: inherit;
    cursor: pointer;
    text-align: center;
    width: 100%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
  }

  .detailButton.truncated {
    justify-content: flex-start;
  }

  .detailInline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: min(280px, 100%);
    flex-wrap: nowrap;

    @media ${Device.laptop} {
      width: min(360px, 100%);
    }
  }

  .detailText {
    display: block;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
  }

  .detailButton.truncated .detailText {
    text-align: left;
  }

  .detailMore {
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.color1};
    cursor: pointer;
    font-weight: 600;
    font-size: 0.85rem;
    text-decoration: underline;
    text-underline-offset: 2px;
    padding: 0;
    flex-shrink: 0;
  }

  .tableScroll {
    width: 100%;
    overflow-x: auto;
    overflow-y: auto;
    max-height: clamp(240px, 50vh, 520px);
    -webkit-overflow-scrolling: touch;
  }
`;

const PreviewOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: var(--overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  z-index: 2100;
`;

const PreviewCard = styled.div`
  width: min(560px, 100%);
  background: ${({ theme }) => theme.bgtotal};
  border-radius: 16px;
  box-shadow: var(--shadow-elev-1);
  padding: 18px;
  display: grid;
  gap: 14px;

  .previewHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      min-width: 0;
      overflow-wrap: anywhere;
    }

    button {
      border: none;
      background: transparent;
      font-size: 20px;
      cursor: pointer;
      color: ${({ theme }) => theme.text};
    }
  }

  .previewMeta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 18px;
    color: ${({ theme }) => theme.textsecundary};
    font-weight: 500;
  }

  .previewMeta span {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .previewDetails {
    margin: 0;
    white-space: pre-wrap;
    color: ${({ theme }) => theme.text};
    overflow-wrap: anywhere;
    word-break: break-word;
  }
`;
