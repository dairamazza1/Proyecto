import styled from "styled-components";
import { AccionTabla, Paginacion } from "../../../index";
import { v } from "../../../styles/variables";
import { useRef, useState } from "react";
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

const statusValues = {
  rejected: "Rechazado",
  approved: "Aprobado",
  pending: "Pendiente",
};

const formatStatus = (value) =>
  statusValues[String(value ?? "").toLowerCase()] ?? "-";

const formatNombre = (persona) => {
  if (!persona) return "-";
  const firstName = persona.first_name ?? "";
  const lastName = persona.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || "-";
};

const formatDurationType = (value) => {
  if (value === "permanente") return "Permanente";
  if (value === "transitorio") return "Transitorio";
  return value ?? "-";
};

// const formatDni = (empleado) => {
//   const number = empleado?.document_number ?? "";
//   const type = empleado?.document_type ?? "";
//   if (!number && !type) return "-";
//   return `${type} ${number}`.trim();
// };

const getSucursalAddress = (empleado) => {
  const raw = Array.isArray(empleado?.sucursal)
    ? empleado.sucursal[0]
    : empleado?.sucursal;
  return raw?.sucursal?.address || "-";
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

const TEMPLATE_URL = "/templates/cambio_template.docx";

const resolveEmpresaNombre = (cambio, empresaNombre) => {
  const storeName = (empresaNombre ?? "").trim();
  if (storeName && storeName !== "Empresa") {
    return storeName;
  }
  return cambio?.empleado?.empresa?.name || "Empresa";
};

const buildTemplateData = (cambio, empresaNombre) => ({
  empresa_nombre: resolveEmpresaNombre(cambio, empresaNombre),
  empleado: formatNombre(cambio?.empleado),
  empleado_reemplazo: formatNombre(cambio?.empleado_reemplazo),
  start_date: formatDate(cambio?.start_date) ?? "-",
  end_date: formatDate(cambio?.end_date) ?? "-",
  duration_type: formatDurationType(cambio?.duration_type),
  horario_anterior: cambio?.previous_schedule ?? "-",
  horario_nuevo: cambio?.new_schedule ?? "-",
  tareas_anteriores: cambio?.previous_tasks ?? "-",
  tareas_nuevas: cambio?.new_tasks ?? "-",
  motivo: cambio?.change_reason ?? "-",
  estado: formatStatus(cambio?.status),
  created_at: formatDateTime(cambio?.created_at) ?? "-" ,
  dni: cambio?.empleado?.document_number,
  puesto: cambio?.empleado?.puesto?.name ?? "-",
  sucursal_direccion: getSucursalAddress(cambio?.empleado),
});

export function TablaCambios({ data, onEdit, onDelete, empresaNombre }) {
  if (data == null) return null;
  const [columnFilters] = useState([]);
  const [sorting, setSorting] = useState([
    { id: "start_date", desc: true },
  ]);
  const [previewCambio, setPreviewCambio] = useState(null);
  const templateRef = useRef(null);

  const handleOpenPreview = (cambio) => {
    setPreviewCambio(cambio);
  };

  const handleClosePreview = () => {
    setPreviewCambio(null);
  };

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

  const handleExportDocx = async (cambio) => {
    try {
      const template = await loadTemplate();
      const zip = new PizZip(template);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{{", end: "}}" },
      });
      doc.render(buildTemplateData(cambio, empresaNombre));
      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const fileDate = buildFileDate(
        cambio?.start_date || cambio?.created_at
      );
      
      const fileName = `legajo_cambio_turno_${cambio?.empleado.last_name ?? "registro"}_${fileDate}.docx`;
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
      accessorKey: "start_date",
      header: "Fecha inicio",
      meta: {
        cardLabel: "Fecha inicio",
        cardValue: (row) => formatDate(row.start_date),
      },
      cell: (info) => (
        <div data-title="Fecha inicio" className="ContentCell">
          <span>{formatDate(info.getValue())}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "end_date",
      header: "Fecha fin",
      meta: {
        cardLabel: "Fecha fin",
        cardValue: (row) => formatDate(row.end_date),
      },
      cell: (info) => (
        <div data-title="Fecha fin" className="ContentCell">
          <span>{formatDate(info.getValue())}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "previous_schedule",
      header: "Hora anterior",
      meta: {
        cardLabel: "Hora anterior",
        cardValue: (row) => row.previous_schedule ?? "-",
      },
      cell: (info) => (
        <div data-title="Hora anterior" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "new_schedule",
      header: "Hora nueva",
      meta: {
        cardLabel: "Hora nueva",
        cardValue: (row) => row.new_schedule ?? "-",
      },
      cell: (info) => (
        <div data-title="Hora nueva" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "previous_tasks",
      header: "Tarea anterior",
      meta: {
        cardLabel: "Tarea anterior",
        cardValue: (row) => row.previous_tasks ?? "-",
      },
      cell: (info) => (
        <div data-title="Tarea anterior" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "new_tasks",
      header: "Tarea nueva",
      meta: {
        cardLabel: "Tarea nueva",
        cardValue: (row) => row.new_tasks ?? "-",
      },
      cell: (info) => (
        <div data-title="Tarea nueva" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "change_reason",
      header: "Motivo",
      meta: {
        cardLabel: "Motivo",
        cardValue: (row) => row.change_reason ?? "-",
      },
      cell: (info) => (
        <div data-title="Motivo" className="ContentCell">
          <span>{info.getValue() ?? "-"}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "empleado_reemplazado",
      header: "Empleado reemplazado",
      accessorFn: (row) => formatNombre(row.empleado_reemplazo),
      meta: {
        cardLabel: "Empleado reemplazado",
        cardValue: (row) => formatNombre(row.empleado_reemplazo),
      },
      cell: (info) => (
        <div data-title="Empleado reemplazado" className="ContentCell">
          <span>{formatNombre(info.row.original.empleado_reemplazo)}</span>
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
          <AccionTabla
            funcion={() => onEdit?.(info.row.original)}
            fontSize="18px"
            color="#7d7d7d"
            icono={<v.iconeditarTabla />}
          />
          <AccionTabla
            funcion={() => onDelete?.(info.row.original)}
            fontSize="18px"
            color={v.rojo}
            icono={<v.iconeliminarTabla />}
          />
          <AccionTabla
            funcion={() => handleOpenPreview(info.row.original)}
            fontSize="18px"
            color="#7d7d7d"
            icono={<v.iconoWord />}
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
                <h3>
                  {cambio.start_date
                    ? formatDate(cambio.start_date)
                    : formatDurationType(cambio.duration_type)}
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
                <button type="button" onClick={() => onEdit?.(cambio)}>
                  Editar
                </button>
                <button type="button" onClick={() => handleOpenPreview(cambio)}>
                  Vista previa
                </button>
                <button type="button" onClick={() => onDelete?.(cambio)}>
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
      {previewCambio && (
        <PreviewOverlay
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleClosePreview();
            }
          }}
        >
          <PreviewModal>
            <div className="headers">
              <section>
                <h2>Vista previa</h2>
              </section>
              <section>
                <span onClick={handleClosePreview}>x</span>
              </section>
            </div>
            <div className="previewBody">
              <h3>{resolveEmpresaNombre(previewCambio, empresaNombre)}</h3>
              <p className="subtitle">ACUERDO DE CAMBIO DE HORRIO Y/O MODIFICACIÓN DE TAREAS</p>
              <div className="previewGrid">
                <div className="previewRow">
                  <span className="label">Empleado</span>
                  <span className="value">
                    {formatNombre(previewCambio.empleado)}
                  </span>
                </div>
                <div className="previewRow">
                  <span className="label">Empleado reemplazado</span>
                  <span className="value">
                    {formatNombre(previewCambio.empleado_reemplazo)}
                  </span>
                </div>
             
                <div className="previewRow">
                  <span className="label">Tipo de duracion</span>
                  <span className="value">
                    {formatDurationType(previewCambio.duration_type)}
                  </span>
                </div>
                <div className="previewRow">
                  <span className="label">Fecha inicio</span>
                  <span className="value">
                    {formatDate(previewCambio.start_date)}
                  </span>
                </div>
                <div className="previewRow">
                  <span className="label">Fecha fin</span>
                  <span className="value">
                    {formatDate(previewCambio.end_date)}
                  </span>
                </div>
                <div className="previewRow">
                  <span className="label">Horario anterior</span>
                  <span className="value">
                    {previewCambio.previous_schedule ?? "-"}
                  </span>
                </div>
                <div className="previewRow">
                  <span className="label">Horario nuevo</span>
                  <span className="value">
                    {previewCambio.new_schedule ?? "-"}
                  </span>
                </div>
                <div className="previewRow">
                  <span className="label">Tareas anteriores</span>
                  <span className="value">
                    {previewCambio.previous_tasks ?? "-"}
                  </span>
                </div>
                <div className="previewRow">
                  <span className="label">Tareas nuevas</span>
                  <span className="value">{previewCambio.new_tasks ?? "-"}</span>
                </div>
                <div className="previewRow">
                  <span className="label">Motivo</span>
                  <span className="value">
                    {previewCambio.change_reason ?? "-"}
                  </span>
                </div>
          
              </div>
            </div>
            <div className="previewActions">
              <button
                type="button"
                className="secondary"
                onClick={handleClosePreview}
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handleExportDocx(previewCambio)}
              >
                Descargar Word
              </button>
            </div>
          </PreviewModal>
        </PreviewOverlay>
      )}
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
    flex-wrap: wrap;
    gap: 8px;

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

const PreviewOverlay = styled.div`
  transition: 0.3s;
  top: 0;
  left: 0;
  position: fixed;
  background-color: rgba(10, 9, 9, 0.5);
  display: flex;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 16px;
`;

const PreviewModal = styled.div`
  position: relative;
  width: min(720px, 100%);
  max-width: 100%;
  border-radius: 18px;
  background: ${({ theme }) => theme.bgtotal};
  box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.25);
  padding: 18px 22px 20px 22px;
  display: grid;
  gap: 16px;

  @media (min-width: ${v.bplisa}) {
    padding: 20px 28px 22px 28px;
  }

  .headers {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    span {
      font-size: 20px;
      cursor: pointer;
    }
  }

  .previewBody {
    display: grid;
    gap: 12px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      text-align: center;
    }

    .subtitle {
      margin: 0;
      text-align: center;
      color: ${({ theme }) => theme.textsecundary};
      font-size: 0.95rem;
    }
  }

  .previewGrid {
    display: grid;
    gap: 10px;
  }

  .previewRow {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
  }

  .label {
    color: ${({ theme }) => theme.textsecundary};
  }

  .value {
    font-weight: 600;
    color: ${({ theme }) => theme.text};
    text-align: right;
    max-width: 100%;
    word-break: break-word;
  }

  .previewActions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;

    button {
      border: none;
      border-radius: 999px;
      padding: 8px 16px;
      font-weight: 600;
      cursor: pointer;
      background: rgba(31, 141, 255, 0.15);
      color: ${({ theme }) => theme.color1};
    }

    button.secondary {
      background: rgba(0, 0, 0, 0.08);
      color: ${({ theme }) => theme.text};
    }
  }
`;
