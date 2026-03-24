import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
} from "docx";

const outputPath = resolve(
  process.cwd(),
  "public",
  "templates",
  "evoluciones_template.docx",
);

const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph({
          text: "{{empresa_nombre}}",
          heading: HeadingLevel.HEADING_4,
          alignment: AlignmentType.LEFT,
        }),
        new Paragraph({
          text: "Evoluciones del paciente",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Paciente: {{paciente_nombre}}" }),
        new Paragraph({ text: "Documento: {{paciente_documento}}" }),
        new Paragraph({
          text: "Fecha de nacimiento: {{paciente_fecha_nacimiento}}",
        }),
        new Paragraph({ text: "Edad: {{paciente_edad}}" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Sucursal: {{internacion_sucursal}}" }),
        new Paragraph({
          text: "Fecha de ingreso: {{internacion_fecha_ingreso}}",
        }),
        new Paragraph({ text: "Fecha de egreso: {{internacion_fecha_egreso}}" }),
        new Paragraph({
          text: "Motivo de internacion: {{internacion_motivo}}",
        }),
        new Paragraph({
          text: "Diagnostico: {{internacion_diagnostico}}",
        }),
        new Paragraph({
          text: "Periodo impreso: {{periodo_desde}} - {{periodo_hasta}}",
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "{{#evoluciones}}" }),
        new Paragraph({ text: "Fecha y hora: {{fecha_hora}}" }),
        new Paragraph({ text: "Profesional: {{profesional}}" }),
        new Paragraph({ text: "Detalle: {{detalle}}" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "{{/evoluciones}}" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Firma de equipo tratante: ___________________________" }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, buffer);
