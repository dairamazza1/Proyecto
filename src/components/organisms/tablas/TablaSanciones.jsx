import styled from "styled-components";
import { AccionTabla, Paginacion, resolvePerfilDisplayName } from "../../../index";
import { v } from "../../../styles/variables";
import { Device, DeviceMax } from "../../../styles/breakpoints";
import { useRef, useState } from "react";
import { usePermissions } from "../../../hooks/usePermissions";
import Swal from "sweetalert2";
import { saveAs } from "file-saver";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

const TEMPLATE_URL = "/templates/sancion_template.docx";

const formatNombre = (persona) => {
  if (!persona) return "-";
  const firstName = persona.first_name ?? "";
  const lastName = persona.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || "-";
};

// const formatDni = (empleado) => {
//   const type = empleado?.document_type ?? "";
//   const number = empleado?.document_number ?? "";
//   const combined = `${type} ${number}`.trim();
//   return combined || "-";
// };

const getSucursalAddress = (empleado) => {
  const raw = Array.isArray(empleado?.sucursal)
    ? empleado.sucursal[0]
    : empleado?.sucursal;
  return raw?.sucursal?.address || "-";
};

const formatDateRange = (startDate, endDate) => {
  const startLabel = formatDate(startDate);
  const endLabel = formatDate(endDate);
  if (startLabel === "-" && endLabel === "-") return "-";
  if (startLabel !== "-" && endLabel !== "-") {
    return `${startLabel} - ${endLabel}`;
  }
  return startLabel !== "-" ? startLabel : endLabel;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return String(value);
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const buildFileDate = (value) => {
  if (!value) return "sin_fecha";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.valueOf())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }
  const raw = String(value);
  const [year, month, day] = raw.split("-");
  if (!year || !month || !day) {
    return raw.replace(/[^\d]/g, "") || "sin_fecha";
  }
  return `${year}${month}${day}`;
};

const resolveEmpresaNombre = (sancion) =>
  sancion?.empleado?.empresa?.name || "Empresa";

const buildTemplateData = (sancion, createdByLabel) => ({
  empresa_nombre: resolveEmpresaNombre(sancion),
  sucursal_direccion: getSucursalAddress(sancion?.empleado),
  empleado: formatNombre(sancion?.empleado),
  dni: sancion?.empleado?.document_number,
  puesto: sancion?.empleado?.puesto?.name ?? "-",
  created_at: formatDateTime(sancion?.created_at) ?? "-",
  created_by: createdByLabel ?? "-",
  motivo: sancion?.sanction_type ?? "-",
  horario_anterior: formatDateRange(
    sancion?.sanction_date_start,
    sancion?.sanction_date_end
  ),
  tareas_anteriores: sancion?.description ?? "-",
  policy_reference: sancion?.policy_reference ?? "-",
});

export function TablaSanciones({ data, onEdit, onDelete }) {
  const [columnFilters] = useState([]);
  const [sorting, setSorting] = useState([
    { id: "sanction_date_start", desc: true },
  ]);
  const templateRef = useRef(null);
  
  // Hook de permisos
  const { canUpdate, canDelete, canExport } = usePermissions();
  const canExportDocs = canExport("sanciones");
  const safeData = data ?? [];
  const getCreatedByLabel = (row) =>
    resolvePerfilDisplayName(row?.creador, row?.created_by);

  const loadTemplate = async () => {
    if (templateRef.current) return templateRef.current;
    const response = await fetch(TEMPLATE_URL);
    if (!response.ok) {
      throw new Error("No se pudo cargar la plantilla Word.");
    }
    const arrayBuffer = await response.arrayBuffer();
    templateRef.current = arrayBuffer;
    return arrayBuffer;
  };

  const handleExportDocx = async (sancion) => {
    try {
      const template = await loadTemplate();
      const zip = new PizZip(template);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{{", end: "}}" },
      });
      const createdByLabel = getCreatedByLabel(sancion);
      doc.render(buildTemplateData(sancion, createdByLabel));
      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const fileDate = buildFileDate(
        sancion?.sanction_date_start || sancion?.created_at
      );
      const fileName = `legajo_sancion_${sancion?.empleado?.last_name ?? "registro"}_${fileDate}.docx`;
      saveAs(blob, fileName);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al exportar el documento.",
      });
    }
  };

  const columns = [
    {
      accessorKey: "sanction_type",
      header: "Tipo",
      meta: {
        cardLabel: "Tipo",
        cardValue: (row) => row.sanction_type ?? "-",
      },
      cell: (info) => (
        <div data-title="Tipo" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "sanction_date_start",
      header: "Desde",
      meta: {
        cardLabel: "Desde",
        cardValue: (row) => formatDate(row.sanction_date_start),
      },
      cell: (info) => (
        <div data-title="Desde" className="ContentCell">
          <span>{formatDate(info.getValue())}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "sanction_date_end",
      header: "Hasta",
      meta: {
        cardLabel: "Hasta",
        cardValue: (row) => formatDate(row.sanction_date_end),
      },
      cell: (info) => (
        <div data-title="Hasta" className="ContentCell">
          <span>{formatDate(info.getValue())}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "policy_reference",
      header: "Politica incumplida",
      meta: {
        cardLabel: "Politica incumplida",
        cardValue: (row) => row.policy_reference ?? "-",
      },
      cell: (info) => (
        <div data-title="Politica" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "created_by",
      header: "Creado por",
      accessorFn: (row) => getCreatedByLabel(row),
      meta: {
        cardLabel: "Creado por",
        cardValue: (row) => getCreatedByLabel(row),
      },
      cell: (info) => (
        <div data-title="Creado por" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
      sortingFn: "alphanumeric",
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: (info) => (
        <div data-title="Acciones" className="ContentCell">
          {/* Mostrar botón de editar SOLO si tiene permiso */}
          {canUpdate('sanciones') && (
            <AccionTabla
              funcion={() => onEdit?.(info.row.original)}
              fontSize="18px"
              color="#7d7d7d"
              icono={<v.iconeditarTabla />}
            />
          )}
          {/* Mostrar botón de eliminar SOLO si tiene permiso */}
          {canDelete('sanciones') && (
            <AccionTabla
              funcion={() => onDelete?.(info.row.original)}
              fontSize="18px"
              color={v.rojo}
              icono={<v.iconeliminarTabla />}
            />
          )}
          {/* Botón de exportar visible para todos */}
          {canExportDocs && (
            <AccionTabla
              funcion={() => handleExportDocx(info.row.original)}
              fontSize="18px"
              color="#7d7d7d"
              icono={<v.iconoWord />}
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
          const sancion = row.original;
          const cardFields = columns
            .filter((column) => column.meta?.cardLabel)
            .map((column) => ({
              label: column.meta?.cardLabel,
              value: column.meta?.cardValue?.(sancion),
            }));
          return (
            <article className="card" key={row.id}>
              <div className="cardHeader">
                <h3>{sancion.sanction_type ?? "-"}</h3>
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
                {/* Mostrar botón de editar SOLO si tiene permiso */}
                {canUpdate('sanciones') && (
                  <button type="button" onClick={() => onEdit?.(sancion)}>
                    Editar
                  </button>
                )}
                {/* Botón de exportar visible para todos */}
                {canExportDocs && (
                  <button
                    type="button"
                    onClick={() => handleExportDocx(sancion)}
                  >
                    Descargar Word
                  </button>
                )}
                {/* Mostrar botón de eliminar SOLO si tiene permiso */}
                {canDelete('sanciones') && (
                  <button type="button" onClick={() => onDelete?.(sancion)}>
                    Eliminar
                  </button>
                )}
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
