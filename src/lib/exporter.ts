import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  BorderStyle,
} from 'docx';
import type { ProjectRecord, Engineer } from '@/types';

function cell(text: string, bold = false) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold, size: 20 })] })],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

export async function exportCredentials(
  projects: ProjectRecord[],
  engineers: Engineer[],
): Promise<void> {
  const projectRows = [
    new TableRow({
      children: ['용역명', '발주기관', '계약금액', '용역기간', '수행내용'].map((h) =>
        cell(h, true),
      ),
    }),
    ...projects.map(
      (p) =>
        new TableRow({
          children: [p.serviceTitle, p.agency, p.contractAmount, p.servicePeriod, p.description].map(
            (v) => cell(v),
          ),
        }),
    ),
  ];

  const engineerRows = [
    new TableRow({
      children: ['성명', '자격증', '주요경력', '투입예정 역할'].map((h) => cell(h, true)),
    }),
    ...engineers.map(
      (e) =>
        new TableRow({
          children: [e.name, e.certification, e.experience, e.role].map((v) => cell(v)),
        }),
    ),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: '유사용역 실적',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: projectRows,
          }),
          new Paragraph({ text: '', spacing: { after: 400 } }),
          new Paragraph({
            text: '기술자 경력',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: engineerRows,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `실적경력_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
