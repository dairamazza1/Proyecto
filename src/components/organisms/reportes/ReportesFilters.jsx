import styled from "styled-components";
import { Device } from "../../../styles/breakpoints";

const MONTHS = [
  { value: "", label: "Mes" },
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

export function ReportesFilters({
  filters,
  onChange,
  empleados = [],
  loadingEmpleados = false,
}) {
  return (
    <Container>
      <Field>
        <label htmlFor="reporte-dia">Dia</label>
        <input
          id="reporte-dia"
          type="number"
          min="1"
          max="31"
          value={filters.day ?? ""}
          onChange={(e) => onChange("day", e.target.value)}
        />
      </Field>
      <Field>
        <label htmlFor="reporte-mes">Mes</label>
        <select
          id="reporte-mes"
          value={filters.month ?? ""}
          onChange={(e) => onChange("month", e.target.value)}
        >
          {MONTHS.map((month) => (
            <option key={month.value || "none"} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <label htmlFor="reporte-anio">Ano</label>
        <input
          id="reporte-anio"
          type="number"
          min="2000"
          max="2100"
          value={filters.year ?? ""}
          onChange={(e) => onChange("year", e.target.value)}
        />
      </Field>
      <Field className="field-span">
        <label htmlFor="reporte-empleado">Empleado</label>
        <select
          id="reporte-empleado"
          value={filters.empleadoId ?? ""}
          onChange={(e) => onChange("empleadoId", e.target.value)}
        >
          <option value="">
            {loadingEmpleados ? "Cargando..." : "Todos los empleados"}
          </option>
          {empleados.map((empleado) => (
            <option key={empleado.id} value={empleado.id}>
              {`${empleado.last_name ?? ""}, ${empleado.first_name ?? ""}`.trim()}
              {empleado.employee_id_number
                ? ` (${empleado.employee_id_number})`
                : ""}
            </option>
          ))}
        </select>
      </Field>
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(1, minmax(0, 1fr));

  @media ${Device.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media ${Device.tablet} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const Field = styled.div`
  display: grid;
  gap: 6px;

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }

  input,
  select {
    height: 38px;
    border-radius: 12px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    padding: 0 12px;
    font-size: 0.95rem;
  }

  &.field-span {
    @media ${Device.mobile} {
      grid-column: span 2;
    }
    @media ${Device.tablet} {
      grid-column: span 2;
    }
  }
`;
