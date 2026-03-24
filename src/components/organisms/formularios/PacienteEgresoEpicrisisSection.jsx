import { useController } from "react-hook-form";
import styled from "styled-components";
import { InputText } from "./inputText";
import { Device } from "../../../styles/breakpoints";
import { v as V } from "../../../styles/variables";
import {
  PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_BOOLEAN_FIELDS,
  PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_SELECT_FIELDS,
  PACIENTE_EGRESO_EPICRISIS_PROFESSIONAL_BOOLEAN_FIELDS,
  PACIENTE_EGRESO_EPICRISIS_TEXT_FIELDS,
} from "../../../utils/pacienteEpicrisis";

function BooleanField({ register, name, label }) {
  return (
    <article>
      <BooleanToggle>
        <label>
          <input type="checkbox" {...register(name)} />
          <span className="text">{label}</span>
        </label>
      </BooleanToggle>
    </article>
  );
}

function SingleOptionChipField({ control, name, label, options }) {
  const { field } = useController({
    control,
    name,
    defaultValue: "",
  });

  const selectedValue = String(field.value ?? "").trim();

  const selectValue = (option) => {
    field.onChange(selectedValue === option ? "" : option);
  };

  return (
    <article>
      <ChipFieldCard>
        <div className="fieldHeader">
          <span className="label">{label}</span>
          <small>Seleccione una opcion</small>
        </div>
        <div className="chipList">
          {options.map((option) => (
            <button
              type="button"
              key={option}
              className={selectedValue === option ? "active" : ""}
              onClick={() => selectValue(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </ChipFieldCard>
    </article>
  );
}

export function PacienteEgresoEpicrisisSection({
  control,
  register,
}) {
  return (
    <Container>
      <GroupCard>
        <div className="groupHeader">
          <h4>Informe interdisciplinario</h4>
          <small>Estado mental y observaciones clinicas del egreso</small>
        </div>
        <div className="fieldsGrid">
          {PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_BOOLEAN_FIELDS.map(
            (field) => (
              <BooleanField
                key={field.name}
                register={register}
                name={field.name}
                label={field.label}
              />
            ),
          )}

          {PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_SELECT_FIELDS.map(
            (field) => (
              <SingleOptionChipField
                key={field.name}
                control={control}
                name={field.name}
                label={field.label}
                options={field.options}
              />
            ),
          )}
        </div>
      </GroupCard>

      <GroupCard>
        <div className="groupHeader">
          <h4>Consideraciones profesionales</h4>
          <small>Criterio clinico y recomendaciones para el alta</small>
        </div>
        <div className="fieldsGrid">
          {PACIENTE_EGRESO_EPICRISIS_PROFESSIONAL_BOOLEAN_FIELDS.map(
            (field) => (
              <BooleanField
                key={field.name}
                register={register}
                name={field.name}
                label={field.label}
              />
            ),
          )}

          {PACIENTE_EGRESO_EPICRISIS_TEXT_FIELDS.map((field) => (
            <article key={field.name} className="full">
              <InputText icono={<V.iconoImportante />}>
                <textarea
                  className="form__field textarea"
                  rows={field.rows}
                  placeholder={field.label}
                  {...register(field.name)}
                />
                <label className="form__label">{field.label}</label>
              </InputText>
            </article>
          ))}
        </div>
      </GroupCard>
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  gap: 14px;
`;

const GroupCard = styled.section`
  border: 1px dashed ${({ theme }) => theme.color2};
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 12px;

  .groupHeader {
    display: grid;
    gap: 3px;
  }

  .groupHeader h4 {
    margin: 0;
    font-size: 1rem;
    color: ${({ theme }) => theme.text};
  }

  .groupHeader small {
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.85rem;
  }

  .fieldsGrid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px 18px;
  }

  .fieldsGrid article.full {
    grid-column: 1 / -1;
  }

  .textarea {
    resize: vertical;
    min-height: 100px;
    padding-top: 12px;
  }

  @media ${Device.tablet} {
    .fieldsGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;

const BooleanToggle = styled.div`
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 14px;
  background: ${({ theme }) => theme.bg};

  label {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 12px;
    cursor: pointer;
  }

  input {
    width: 22px;
    height: 22px;
    flex: 0 0 22px;
    accent-color: ${({ theme }) => theme.color1};
    cursor: pointer;
  }

  .text {
    color: ${({ theme }) => theme.text};
    font-size: 0.93rem;
    font-weight: 600;
    line-height: 1.35;
  }
`;

const ChipFieldCard = styled.div`
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 10px;
  background: ${({ theme }) => theme.bg};

  .fieldHeader {
    display: grid;
    gap: 2px;
  }

  .label {
    font-size: 0.94rem;
    font-weight: 700;
    color: ${({ theme }) => theme.text};
  }

  small {
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.82rem;
  }

  .chipList {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chipList button {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 999px;
    background: transparent;
    color: ${({ theme }) => theme.text};
    padding: 7px 12px;
    cursor: pointer;
    transition:
      border-color 160ms ease,
      background 160ms ease,
      color 160ms ease;
    font-size: 0.86rem;
  }

  .chipList button.active {
    border-color: ${({ theme }) => theme.color1};
    background: var(--bg-accent-soft);
    color: ${({ theme }) => theme.color1};
    font-weight: 700;
  }
`;
