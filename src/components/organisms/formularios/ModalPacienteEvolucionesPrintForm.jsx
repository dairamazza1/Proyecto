import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Swal from "sweetalert2";
import { Btn1, InputText, Spinner1 } from "../../../index";
import {
  clampDateRangeToIngreso,
  getIngresoArgentinaDateBounds,
} from "../../../utils/argentinaDateTime";
import { DeviceMax } from "../../../styles/breakpoints";
import { v } from "../../../styles/variables";

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value);

const formatDateInputLabel = (value) => {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "-";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

export function ModalPacienteEvolucionesPrintForm({
  ingreso = null,
  defaultFromDate = "",
  defaultToDate = "",
  onClose,
  onPrint,
}) {
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ingresoBounds = useMemo(
    () => getIngresoArgentinaDateBounds(ingreso),
    [ingreso],
  );

  useEffect(() => {
    setFromDate(defaultFromDate);
    setToDate(defaultToDate);
  }, [defaultFromDate, defaultToDate]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleUseIngresoPeriod = () => {
    setFromDate(ingresoBounds.fromDate ?? "");
    setToDate(ingresoBounds.toDate ?? "");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!ingreso?.id) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Seleccione un ingreso para imprimir las evoluciones.",
      });
      return;
    }
    if (!fromDate || !toDate) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Debe indicar las fechas desde y hasta.",
      });
      return;
    }
    if (fromDate > toDate) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "La fecha desde no puede ser mayor a la fecha hasta.",
      });
      return;
    }

    const clampedRange = clampDateRangeToIngreso({
      fromDate,
      toDate,
      ingreso,
    });

    if (
      clampedRange.wasClamped ||
      clampedRange.fromDate !== fromDate ||
      clampedRange.toDate !== toDate
    ) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "El rango debe estar dentro del periodo de internacion seleccionado.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onPrint?.({ fromDate, toDate });
      onClose?.();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error?.message || "No se pudo imprimir el documento.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <Spinner1 />;
  }

  return (
    <Overlay onClick={(event) => event.target === event.currentTarget && onClose?.()}>
      <Modal onClick={(event) => event.stopPropagation()}>
        <div className="headers">
          <section>
            <h1>Imprimir evoluciones</h1>
            <p>
              Seleccione el rango a exportar para la internacion elegida.
            </p>
          </section>
          <section>
            <span onClick={() => onClose?.()}>x</span>
          </section>
        </div>

        <form className="formulario" onSubmit={handleSubmit}>
          <section className="summary">
            <div>
              <span className="label">Periodo de internacion</span>
              <strong>
                {formatDateInputLabel(ingresoBounds.fromDate)} -{" "}
                {formatDateInputLabel(ingresoBounds.toDate)}
              </strong>
            </div>
          </section>

          <section className="form-subcontainer">
            <article>
              <InputText icono={<v.iconoCalendario />}>
                <input
                  className="form__field"
                  type="date"
                  min={ingresoBounds.fromDate ?? undefined}
                  max={ingresoBounds.toDate ?? undefined}
                  value={fromDate}
                  onChange={(event) => setFromDate(safeString(event.target.value))}
                />
                <label className="form__label">Desde</label>
              </InputText>
            </article>

            <article>
              <InputText icono={<v.iconoCalendario />}>
                <input
                  className="form__field"
                  type="date"
                  min={ingresoBounds.fromDate ?? undefined}
                  max={ingresoBounds.toDate ?? undefined}
                  value={toDate}
                  onChange={(event) => setToDate(safeString(event.target.value))}
                />
                <label className="form__label">Hasta</label>
              </InputText>
            </article>
          </section>

          <div className="helperActions">
            <button
              type="button"
              className="secondaryAction"
              onClick={handleUseIngresoPeriod}
            >
              Usar periodo de internacion
            </button>
          </div>

          <div className="acciones">
            <Btn1
              icono={<v.iconocerrar />}
              titulo="Cancelar"
              bgcolor="var(--bg-surface-muted)"
              funcion={() => onClose?.()}
              tipo="button"
            />
            <Btn1
              icono={<v.iconoWord />}
              titulo="Imprimir"
              bgcolor={v.colorPrincipal}
            />
          </div>
        </form>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: var(--overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;

  @media ${DeviceMax.mobile} {
    padding: 16px;
    align-items: flex-start;
    overflow-y: auto;
  }
`;

const Modal = styled.div`
  width: min(100%, 720px);
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  box-shadow: var(--shadow-elev-2);
  padding: 22px 22px 18px;
  display: grid;
  gap: 18px;

  .headers {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;

    h1 {
      margin: 0;
      font-size: 1.2rem;
    }

    p {
      margin: 6px 0 0;
      color: ${({ theme }) => theme.textsecundary};
    }

    span {
      cursor: pointer;
      font-size: 1.4rem;
      line-height: 1;
    }
  }

  .formulario {
    display: grid;
    gap: 16px;
  }

  .summary {
    border: 1px dashed ${({ theme }) => theme.color2};
    border-radius: 14px;
    padding: 12px 14px;

    .label {
      display: block;
      color: ${({ theme }) => theme.textsecundary};
      font-size: 0.85rem;
      margin-bottom: 4px;
    }
  }

  .form-subcontainer {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .helperActions {
    display: flex;
    justify-content: flex-start;
  }

  .secondaryAction {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 999px;
    background: transparent;
    color: ${({ theme }) => theme.color1};
    padding: 8px 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .acciones {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  @media ${DeviceMax.mobile} {
    width: 100%;
    padding: 18px 16px;

    .form-subcontainer {
      grid-template-columns: 1fr;
    }
  }
`;
