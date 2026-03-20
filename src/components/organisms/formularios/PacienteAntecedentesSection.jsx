import { useEffect, useState } from "react";
import { useController, useWatch } from "react-hook-form";
import styled from "styled-components";
import { InputText } from "./inputText";
import { Device, DeviceMax } from "../../../styles/breakpoints";
import { v as V } from "../../../styles/variables";
import {
  PACIENTE_ANTECEDENTES_CLINICO_BOOLEAN_FIELDS,
  PACIENTE_ANTECEDENTES_CLINICO_TEXT_FIELDS,
  PACIENTE_ANTECEDENTES_PERSONAL_FIELDS,
  PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_BOOLEAN_FIELDS,
  PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_MULTI_FIELDS,
} from "../../../utils/pacienteAntecedentes";

const cleanArray = (value) =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    )
  );

function BooleanField({ control, register, name, label }) {
  const checked = Boolean(
    useWatch({
      control,
      name,
      defaultValue: false,
    })
  );

  return (
    <article>
      <BooleanToggle className={checked ? "active" : ""}>
        <label>
          <input
            type="checkbox"
            checked={checked}
            {...register(name)}
          />
          <span className="checkboxVisual" aria-hidden="true">
            <V.iconoCheck />
          </span>
          <span className="text">{label}</span>
        </label>
      </BooleanToggle>
    </article>
  );
}

function MultiOptionChipField({ control, name, label, options }) {
  const { field } = useController({
    control,
    name,
    defaultValue: [],
  });
  const values = cleanArray(field.value);

  const toggleValue = (option) => {
    field.onChange(
      values.includes(option)
        ? values.filter((value) => value !== option)
        : [...values, option]
    );
  };

  return (
    <article className="full">
      <ChipFieldCard>
        <div className="fieldHeader">
          <span className="label">{label}</span>
          <small>Puede seleccionar mas de una opcion</small>
        </div>
        <div className="chipList">
          {options.map((option) => (
            <button
              type="button"
              key={option}
              className={values.includes(option) ? "active" : ""}
              onClick={() => toggleValue(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </ChipFieldCard>
    </article>
  );
}

function FreeTextChipField({
  control,
  name,
  label,
  placeholder = "Agregar valor",
}) {
  const { field } = useController({
    control,
    name,
    defaultValue: [],
  });
  const [draftValue, setDraftValue] = useState("");
  const values = cleanArray(field.value);

  const pushValue = () => {
    const nextValue = String(draftValue ?? "").trim();
    if (!nextValue || values.includes(nextValue)) return;
    field.onChange([...values, nextValue]);
    setDraftValue("");
  };

  const removeValue = (valueToRemove) => {
    field.onChange(values.filter((value) => value !== valueToRemove));
  };

  return (
    <article className="full">
      <ChipFieldCard>
        <div className="fieldHeader">
          <span className="label">{label}</span>
          <small>Ingrese uno o mas valores</small>
        </div>
        <div className="inputRow">
          <input
            type="text"
            value={draftValue}
            placeholder={placeholder}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              pushValue();
            }}
          />
          <button type="button" onClick={pushValue}>
            Agregar
          </button>
        </div>
        {values.length ? (
          <div className="chipList">
            {values.map((value) => (
              <button
                type="button"
                key={value}
                className="active removable"
                onClick={() => removeValue(value)}
              >
                {value}
                <span aria-hidden="true">x</span>
              </button>
            ))}
          </div>
        ) : (
          <small className="emptyText">Sin valores cargados.</small>
        )}
      </ChipFieldCard>
    </article>
  );
}

export function PacienteAntecedentesSection({
  control,
  register,
  setValue,
  loading = false,
}) {
  const hasTratamientos = useWatch({
    control,
    name: "personal_antecedentes_tratamientos",
  });
  const hasAntecedentesFamilia = useWatch({
    control,
    name: "personal_antecedentes_familia_psiquiatricos",
  });
  const hasMedicacion = useWatch({
    control,
    name: "psicopatologico_medicacion",
  });

  useEffect(() => {
    if (hasTratamientos) return;
    setValue("personal_antecedentes_tratamientos_obs", "");
  }, [hasTratamientos, setValue]);

  useEffect(() => {
    if (hasAntecedentesFamilia) return;
    setValue("personal_antecedentes_familia_psiquiatricos_obs", "");
  }, [hasAntecedentesFamilia, setValue]);

  useEffect(() => {
    if (hasMedicacion) return;
    setValue("psicopatologico_medicacion_obs", []);
  }, [hasMedicacion, setValue]);

  return (
    <Container>
      {loading ? (
        <InfoBox>Cargando antecedentes del paciente...</InfoBox>
      ) : null}

      <GroupCard>
        <div className="groupHeader">
          <h4>Antecedentes personales</h4>
          <small>Antecedentes del desarrollo y del entorno familiar</small>
        </div>
        <div className="fieldsGrid">
          {PACIENTE_ANTECEDENTES_PERSONAL_FIELDS.map((field) => (
            <BooleanField
              key={field.name}
              control={control}
              register={register}
              name={field.name}
              label={field.label}
            />
          ))}

          {hasTratamientos ? (
            <article className="full">
              <InputText icono={<V.iconoImportante />}>
                <textarea
                  className="form__field textarea"
                  rows={3}
                  placeholder="Observaciones"
                  {...register("personal_antecedentes_tratamientos_obs")}
                />
                <label className="form__label">Observaciones</label>
              </InputText>
            </article>
          ) : null}

          {hasAntecedentesFamilia ? (
            <article className="full">
              <InputText icono={<V.iconoImportante />}>
                <textarea
                  className="form__field textarea"
                  rows={3}
                  placeholder="Observaciones"
                  {...register("personal_antecedentes_familia_psiquiatricos_obs")}
                />
                <label className="form__label">Observaciones</label>
              </InputText>
            </article>
          ) : null}
        </div>
      </GroupCard>

      <GroupCard>
        <div className="groupHeader">
          <h4>Antecedentes clinicos</h4>
          <small>Patologias previas, consumo y antecedentes medicos relevantes</small>
        </div>
        <div className="fieldsGrid">
          {PACIENTE_ANTECEDENTES_CLINICO_BOOLEAN_FIELDS.map((field) => (
            <BooleanField
              key={field.name}
              control={control}
              register={register}
              name={field.name}
              label={field.label}
            />
          ))}

          {PACIENTE_ANTECEDENTES_CLINICO_TEXT_FIELDS.map((field) => (
            <article key={field.name} className="full">
              <InputText icono={<V.iconoImportante />}>
                <textarea
                  className="form__field textarea"
                  rows={3}
                  placeholder={field.label}
                  {...register(field.name)}
                />
                <label className="form__label">{field.label}</label>
              </InputText>
            </article>
          ))}
        </div>
      </GroupCard>

      <GroupCard>
        <div className="groupHeader">
          <h4>Examen psicopatologico</h4>
          <small>Seleccione todos los indicadores relevantes</small>
        </div>
        <div className="fieldsGrid">
          {PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_MULTI_FIELDS.map((field) => (
            <MultiOptionChipField
              key={field.name}
              control={control}
              name={field.name}
              label={field.label}
              options={field.options}
            />
          ))}

          {PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_BOOLEAN_FIELDS.map((field) => (
            <BooleanField
              key={field.name}
              control={control}
              register={register}
              name={field.name}
              label={field.label}
            />
          ))}

          {hasMedicacion ? (
            <FreeTextChipField
              control={control}
              name="psicopatologico_medicacion_obs"
              label="Indicar medicacion actual"
              placeholder="Ej.: Clonazepam 0.5 mg"
            />
          ) : null}
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
  transition: border-color 160ms ease, background 160ms ease,
    box-shadow 160ms ease;

  label {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 12px;
    cursor: pointer;
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .checkboxVisual {
    width: 22px;
    height: 22px;
    flex: 0 0 22px;
    border-radius: 7px;
    border: 1px solid ${({ theme }) => theme.color2};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: transparent;
    background: transparent;
    transition: inherit;
  }

  .checkboxVisual svg {
    font-size: 0.82rem;
  }

  .text {
    color: ${({ theme }) => theme.text};
    font-size: 0.93rem;
    font-weight: 600;
    line-height: 1.35;
  }

  &.active {
    border-color: ${({ theme }) => theme.color1};
    background: var(--bg-accent-soft);
    box-shadow: 0 0 0 1px rgba(83, 150, 172, 0.12);
  }

  &.active .checkboxVisual {
    border-color: ${({ theme }) => theme.color1};
    background: ${({ theme }) => theme.color1};
    color: ${({ theme }) => theme.bg};
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

  small,
  .emptyText {
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
    transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
    font-size: 0.86rem;
  }

  .chipList button.active {
    border-color: ${({ theme }) => theme.color1};
    background: var(--bg-accent-soft);
    color: ${({ theme }) => theme.color1};
    font-weight: 700;
  }

  .chipList button.removable {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .chipList button.removable span {
    font-size: 1rem;
    line-height: 1;
  }

  .inputRow {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }

  .inputRow input {
    flex: 1 1 auto;
    min-width: 0;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    padding: 10px 12px;
    outline: none;
  }

  .inputRow input:focus {
    border-color: ${({ theme }) => theme.color1};
  }

  .inputRow button {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    background: var(--bg-surface-muted);
    color: ${({ theme }) => theme.text};
    padding: 0 12px;
    cursor: pointer;
    font-weight: 700;
    white-space: nowrap;
  }

  @media ${DeviceMax.mobile} {
    .inputRow {
      flex-direction: column;
    }
  }
`;

const InfoBox = styled.div`
  border: 1px dashed ${({ theme }) => theme.color2};
  background: ${({ theme }) => theme.bgtotal};
  border-radius: 12px;
  padding: 10px 12px;
  color: ${({ theme }) => theme.textsecundary};
  font-size: 0.9rem;
`;
