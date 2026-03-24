import { useState } from "react";
import styled from "styled-components";
import Swal from "sweetalert2";
import { AccionTabla } from "../../../index";
import { getPacienteEstudioArchivoSignedUrl } from "../../../supabase/crudPacientes";
import { DeviceMax } from "../../../styles/breakpoints";
import { v } from "../../../styles/variables";

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return String(value);
  const pad = (input) => String(input).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()} ${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`;
};

const formatText = (value, fallback = "-") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

export function TablaPacienteEstudios({
  data,
  onEdit,
  canEditRow = () => false,
}) {
  const safeData = Array.isArray(data) ? data : [];
  const [openingFileId, setOpeningFileId] = useState(null);

  if (data == null) return null;

  const handleOpenArchivo = async (archivo) => {
    if (!archivo?.file_path) return;

    try {
      setOpeningFileId(archivo.id ?? archivo.file_path);
      const signedUrl = await getPacienteEstudioArchivoSignedUrl(
        archivo.file_path,
        90,
      );

      if (!signedUrl) {
        throw new Error("No se pudo generar el enlace del archivo.");
      }

      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error?.message || "No se pudo abrir el archivo adjunto.",
      });
    } finally {
      setOpeningFileId(null);
    }
  };

  return (
    <Container>
      <div className="tableScroll">
        <table className="studiesTable">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo de estudio</th>
              <th>Nombre del estudio</th>
              <th>Observacion / indicacion</th>
              <th>Archivo adjunto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {safeData.length ? (
              safeData.map((study) => {
                const attachments = study?.archivos ?? [];
                return (
                  <tr key={study.id}>
                    <td>{formatDateTime(study.requested_at ?? study.created_at)}</td>
                    <td>{formatText(study.study_type)}</td>
                    <td>{formatText(study.study_name)}</td>
                    <td className="textCell">
                      {formatText(study.indication, "Sin observacion.")}
                    </td>
                    <td>
                      {attachments.length ? (
                        <div className="attachmentList">
                          {attachments.map((archivo, index) => (
                            <button
                              key={archivo.id ?? `${study.id}-${index}`}
                              type="button"
                              className="attachmentButton"
                              onClick={() => handleOpenArchivo(archivo)}
                              disabled={openingFileId === (archivo.id ?? archivo.file_path)}
                            >
                              {openingFileId === (archivo.id ?? archivo.file_path)
                                ? "Abriendo..."
                                : "Ver estudio"}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="emptyLabel">Sin archivo</span>
                      )}
                    </td>
                    <td className="actionsCell">
                      {canEditRow(study) ? (
                        <AccionTabla
                          funcion={() => onEdit?.(study)}
                          fontSize="18px"
                          color="#7d7d7d"
                          icono={<v.iconeditarTabla />}
                        />
                      ) : (
                        <span className="emptyLabel">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="emptyRow" colSpan={6}>
                  Sin estudios registrados para esta internacion.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cards">
        {safeData.length ? (
          safeData.map((study) => {
            const attachments = study?.archivos ?? [];
            return (
              <article className="card" key={`card-${study.id}`}>
                <div className="cardHeader">
                  <div>
                    <span className="cardLabel">Nombre del estudio</span>
                    <h3>{formatText(study.study_name)}</h3>
                  </div>
                </div>

                <div className="cardBody">
                  <div className="cardRow">
                    <span className="cardLabel">Fecha</span>
                    <strong>{formatDateTime(study.requested_at ?? study.created_at)}</strong>
                  </div>
                  <div className="cardRow">
                    <span className="cardLabel">Tipo de estudio</span>
                    <strong>{formatText(study.study_type)}</strong>
                  </div>
                  <div className="cardRow">
                    <span className="cardLabel">Observacion / indicacion</span>
                    <p>{formatText(study.indication, "Sin observacion.")}</p>
                  </div>
                  <div className="cardRow">
                    <span className="cardLabel">Archivo adjunto</span>
                    {attachments.length ? (
                      <div className="attachmentList">
                        {attachments.map((archivo, index) => (
                          <button
                            key={`mobile-${archivo.id ?? `${study.id}-${index}`}`}
                            type="button"
                            className="attachmentButton"
                            onClick={() => handleOpenArchivo(archivo)}
                            disabled={openingFileId === (archivo.id ?? archivo.file_path)}
                          >
                            {openingFileId === (archivo.id ?? archivo.file_path)
                              ? "Abriendo..."
                              : "Ver estudio"}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="emptyLabel">Sin archivo</span>
                    )}
                  </div>
                </div>
                {canEditRow(study) ? (
                  <div className="cardActions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => onEdit?.(study)}
                    >
                      Editar registro
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <div className="emptyCard">Sin estudios registrados para esta internacion.</div>
        )}
      </div>
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  gap: 14px;

  .tableScroll {
    overflow-x: auto;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 18px;
    background: ${({ theme }) => theme.bg};
    box-shadow: var(--shadow-elev-1);
  }

  .studiesTable {
    width: 100%;
    min-width: 980px;
    border-collapse: collapse;

    th,
    td {
      padding: 12px 14px;
      border-bottom: 1px solid ${({ theme }) => theme.color2};
      vertical-align: top;
      text-align: left;
    }

    thead th {
      background: var(--bg-surface-muted);
      color: ${({ theme }) => theme.textsecundary};
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }
  }

  .textCell {
    min-width: 240px;
    white-space: pre-wrap;
  }

  .attachmentList {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .attachmentButton {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 999px;
    padding: 8px 12px;
    background: var(--bg-accent-soft);
    color: ${({ theme }) => theme.color1};
    font-weight: 600;
    cursor: pointer;
  }

  .attachmentButton:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .emptyLabel {
    color: ${({ theme }) => theme.textsecundary};
  }

  .emptyRow,
  .emptyCard {
    color: ${({ theme }) => theme.textsecundary};
    text-align: center;
  }

  .actionsCell {
    width: 74px;
    text-align: center;
  }

  .cards {
    display: none;
  }

  @media ${DeviceMax.mobile} {
    .tableScroll {
      display: none;
    }

    .cards {
      display: grid;
      gap: 12px;
    }

    .card,
    .emptyCard {
      border: 1px solid ${({ theme }) => theme.color2};
      border-radius: 18px;
      background: ${({ theme }) => theme.bg};
      box-shadow: var(--shadow-elev-1);
      padding: 14px;
    }

    .card {
      display: grid;
      gap: 14px;
    }

    .cardHeader {
      display: flex;
      gap: 10px;
      justify-content: space-between;
      align-items: flex-start;
    }

    .cardHeader h3 {
      margin: 4px 0 0;
      font-size: 1rem;
      line-height: 1.3;
    }

    .cardBody {
      display: grid;
      gap: 12px;
    }

    .cardActions {
      display: flex;
      justify-content: flex-end;
    }

    .cardActions button {
      border: 1px solid ${({ theme }) => theme.color2};
      border-radius: 999px;
      padding: 10px 14px;
      background: ${({ theme }) => theme.bgtotal};
      color: ${({ theme }) => theme.text};
      font-weight: 600;
    }

    .cardRow {
      display: grid;
      gap: 6px;
    }

    .cardRow p {
      margin: 0;
      white-space: pre-wrap;
    }

    .cardLabel {
      color: ${({ theme }) => theme.textsecundary};
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
  }
`;
