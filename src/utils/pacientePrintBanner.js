import {
  AlignmentType,
  HeadingLevel,
  ImageRun,
  Paragraph,
  TextRun,
} from "docx";

const safeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

export const buildPacientePrintHeader = ({
  banner = null,
  clinicName = "",
  title = "",
  subtitle = "",
} = {}) => {
  const children = [];

  if (banner?.data) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
        children: [
          new ImageRun({
            data: banner.data,
            type: banner.type ?? "png",
            transformation: {
              width: 520,
              height: 92,
            },
          }),
        ],
      }),
    );
  } else if (safeText(clinicName)) {
    children.push(
      new Paragraph({
        text: safeText(clinicName),
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 160 },
      }),
    );
  }

  if (safeText(title)) {
    children.push(
      new Paragraph({
        text: safeText(title),
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 120 },
      }),
    );
  }

  if (safeText(subtitle)) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: safeText(subtitle),
            italics: true,
          }),
        ],
      }),
    );
  }

  return children;
};
