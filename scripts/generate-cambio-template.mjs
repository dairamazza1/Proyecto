import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from "docx";

const outputPath = resolve(
  process.cwd(),
  "public",
  "templates",
  "cambio_template.docx"
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
          text: "Cambio de turnos/actividades",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Empleado: {{empleado}}" }),
        new Paragraph({ text: "Empleado reemplazado: {{empleado_reemplazo}}" }),
        new Paragraph({ text: "Tipo de duracion: {{duration_type}}" }),
        new Paragraph({ text: "Fecha inicio: {{start_date}}" }),
        new Paragraph({ text: "Fecha fin: {{end_date}}" }),
        new Paragraph({ text: "Horario/turno anterior: {{horario_anterior}}" }),
        new Paragraph({ text: "Horario/turno nuevo: {{horario_nuevo}}" }),
        new Paragraph({ text: "Tareas anteriores: {{tareas_anteriores}}" }),
        new Paragraph({ text: "Tareas nuevas: {{tareas_nuevas}}" }),
        new Paragraph({ text: "Motivo: {{motivo}}" }),
        new Paragraph({ text: "Estado: {{estado}}" }),
        new Paragraph({ text: "Fecha de creacion: {{created_at}}" }),
        new Paragraph({ text: "DNI: {{dni}}" }),
        new Paragraph({ text: "Puesto: {{puesto}}" }),
        new Paragraph({ text: "Direccion sucursal: {{sucursal_direccion}}" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Firma y aclaracion:" }),
        new Paragraph({ text: "Solicitante: ___________________________" }),
        new Paragraph({ text: "Aprobador: ___________________________" }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, buffer);
// console.log(`Template generado en ${outputPath}`);
