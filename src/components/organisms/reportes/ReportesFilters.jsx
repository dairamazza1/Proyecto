import styled from "styled-components";
import { Device } from "../../../styles/breakpoints";

export function ReportesFilters({
  filters,
  onChange,
  empleados = [],
  loadingEmpleados = false,
}) {
  return (
    <Container>
      <Field>
        <label htmlFor="reporte-desde">Desde</label>
        <input
          id="reporte-desde"
          type="date"
          value={filters.fromDate ?? ""}
          onChange={(e) => onChange("fromDate", e.target.value)}
        />
      </Field>
      <Field>
        <label htmlFor="reporte-hasta">Hasta</label>
        <input
          id="reporte-hasta"
          type="date"
          min={filters.fromDate || undefined}
          value={filters.toDate ?? ""}
          onChange={(e) => onChange("toDate", e.target.value)}
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
  height: fit-content;
  gap: 12px;
  grid-template-columns: repeat(1, minmax(0, 1fr));

  @media ${Device.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media ${Device.tablet} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
      grid-column: auto;
    }
  }
`;
