import styled from "styled-components";
import { Device } from "../../styles/breakpoints";
import {
  PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_BOOLEAN_FIELDS,
  PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_SELECT_FIELDS,
  PACIENTE_EGRESO_EPICRISIS_PROFESSIONAL_BOOLEAN_FIELDS,
  PACIENTE_EGRESO_EPICRISIS_TEXT_FIELDS,
  getEpicrisisArrayValue,
  getEpicrisisBooleanValue,
  getEpicrisisTextValue,
} from "../../utils/pacienteEpicrisis";

const safeText = (value) => {
  if (value === null || value === undefined) return "-";
  const normalized = String(value).trim();
  return normalized || "-";
};

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
};

const buildPacienteNombre = (paciente) =>
  safeText([paciente?.first_name, paciente?.last_name].filter(Boolean).join(" "));

const buildCoverageLabel = (cobertura) =>
  safeText(
    cobertura?.coverage ?? cobertura?.coverage_display_name ?? cobertura?.coverage_name,
  );

function FieldGrid({ fields = [], epicrisis, formatter }) {
  return (
    <Grid>
      {fields.map((field) => (
        <Item key={field.name}>
          <span className="label">{field.label}</span>
          <span className="value">{formatter(field.name, epicrisis?.[field.name])}</span>
        </Item>
      ))}
    </Grid>
  );
}

export function PacienteEpicrisisView({
  paciente,
  ingreso,
  epicrisis,
  cobertura,
}) {
  const referenceDate =
    ingreso?.discharge_at ?? epicrisis?.updated_at ?? epicrisis?.created_at ?? null;

  return (
    <Container>
      <HeaderCard>
        <div className="titleBlock">
          <span className="eyebrow">Epicrisis de alta sanatorial</span>
          <h3>Clinica de Salud Mental Dr Gutierrez Walker</h3>
        </div>
        <div className="dateBlock">
          <span className="label">Buenos Aires</span>
          <strong>{formatDate(referenceDate)}</strong>
        </div>
      </HeaderCard>

      <SummaryGrid>
        <Item>
          <span className="label">Paciente</span>
          <span className="value">{buildPacienteNombre(paciente)}</span>
        </Item>
        <Item>
          <span className="label">DNI</span>
          <span className="value">{safeText(paciente?.document_number)}</span>
        </Item>
        <Item>
          <span className="label">Cobertura social</span>
          <span className="value">{buildCoverageLabel(cobertura)}</span>
        </Item>
        <Item>
          <span className="label">Fecha de egreso</span>
          <span className="value">{formatDate(ingreso?.discharge_at)}</span>
        </Item>
      </SummaryGrid>

      <Group>
        <div className="groupHeader">
          <h4>Equipo interdisciplinario</h4>
          <small>Campos reservados para completar mas adelante.</small>
        </div>
        <Grid>
          <Item>
            <span className="label">Medico psiquiatra</span>
            <span className="value">-</span>
          </Item>
          <Item>
            <span className="label">Psicologo</span>
            <span className="value">-</span>
          </Item>
        </Grid>
      </Group>

      <Group>
        <div className="groupHeader">
          <h4>Informe interdisciplinario</h4>
          <small>Estado mental y observaciones clinicas consignadas al alta.</small>
        </div>
        <FieldGrid
          fields={PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_BOOLEAN_FIELDS}
          epicrisis={epicrisis}
          formatter={(_fieldName, value) => getEpicrisisBooleanValue(value)}
        />
        <FieldGrid
          fields={PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_SELECT_FIELDS}
          epicrisis={epicrisis}
          formatter={getEpicrisisArrayValue}
        />
      </Group>

      <Group>
        <div className="groupHeader">
          <h4>Consideraciones profesionales</h4>
          <small>Diagnostico, pronostico e indicaciones terapeuticas del egreso.</small>
        </div>
        <FieldGrid
          fields={PACIENTE_EGRESO_EPICRISIS_PROFESSIONAL_BOOLEAN_FIELDS}
          epicrisis={epicrisis}
          formatter={(_fieldName, value) => getEpicrisisBooleanValue(value)}
        />
        <FieldGrid
          fields={PACIENTE_EGRESO_EPICRISIS_TEXT_FIELDS}
          epicrisis={epicrisis}
          formatter={(_fieldName, value) => getEpicrisisTextValue(value)}
        />
      </Group>
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  gap: 12px;
`;

const HeaderCard = styled.section`
  background: ${({ theme }) => theme.bg};
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  .titleBlock {
    display: grid;
    gap: 4px;
  }

  .eyebrow {
    color: ${({ theme }) => theme.color1};
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
  }

  .dateBlock {
    display: grid;
    gap: 4px;
    text-align: right;
  }

  .label {
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.84rem;
  }

  strong {
    font-size: 1rem;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(1, minmax(0, 1fr));

  @media ${Device.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Group = styled.section`
  border: 1px dashed ${({ theme }) => theme.color2};
  border-radius: 16px;
  padding: 14px;
  display: grid;
  gap: 12px;
  background: ${({ theme }) => theme.bg};

  .groupHeader {
    display: grid;
    gap: 3px;
  }

  .groupHeader h4 {
    margin: 0;
    font-size: 1rem;
  }

  .groupHeader small {
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.84rem;
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(1, minmax(0, 1fr));

  @media ${Device.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media ${Device.tablet} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const Item = styled.div`
  display: grid;
  gap: 6px;

  .label {
    font-size: 0.84rem;
    color: ${({ theme }) => theme.textsecundary};
  }

  .value {
    font-size: 0.98rem;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
    word-break: break-word;
    overflow-wrap: anywhere;
  }
`;
