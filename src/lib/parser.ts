import type { ParsedAnnouncement } from '@/types';

const UNCONFIRMED = '미확인 — 원문 확인 필요';

/**
 * pdfjs는 한 페이지의 텍스트를 공백으로 이어 붙인다.
 * 번호항목·기호 앞에 줄바꿈을 삽입해 패턴 매칭을 쉽게 만든다.
 */
function normalizeText(raw: string): string {
  return raw
    // 번호 항목: "  1." "  가." 앞
    .replace(/\s{2,}(\d{1,2}\.)\s/g, '\n$1 ')
    .replace(/\s{2,}([가나다라마바사아자차]\.)\s/g, '\n$1 ')
    // 기호 항목
    .replace(/\s{2,}([○●□■◆▶➲※])\s/g, '\n$1 ')
    // 라인 구분자 역할을 하는 이중 공백을 줄바꿈으로
    .replace(/\s{3,}/g, '\n');
}

function firstLine(str: string): string {
  return str
    .split('\n')[0]
    .split(/\s{2,}/)[0]                           // PDF 이중공백 column 경계
    .replace(/\s+[가나다라마바사아자차]\.\s.*$/, '') // " 라. 과업내용" 같은 suffix
    .replace(/\s+-\s+.*$/, '')                    // " - 다음 항목" suffix
    .trim();
}

function extract(text: string, patterns: RegExp[]): string {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const val = m.slice(1).find((g) => g && g.trim().length > 0) ?? '';
      const clean = firstLine(val.trim());
      if (clean.length > 0) return clean;
    }
  }
  return UNCONFIRMED;
}

function extractSection(text: string, patterns: RegExp[]): string {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const val = m.slice(1).find((g) => g && g.trim().length > 0) ?? '';
      const trimmed = val.trim().slice(0, 500);
      if (trimmed.length > 0) return trimmed;
    }
  }
  return UNCONFIRMED;
}

function extractAgency(text: string): string {
  const explicit = extract(text, [
    /발주기관\s*[:：]\s*(.+)/,
    /수요기관\s*[:：]\s*(.+)/,
    /공고기관\s*[:：]\s*(.+)/,
    /기관명\s*[:：]\s*(.+)/,
    /발주처\s*[:：]\s*(.+)/,
  ]);
  if (!explicit.includes('미확인')) return explicit;

  // 본문에서 "OO공사/청/원 에서는" 패턴으로 추출
  const m = text.match(
    /([가-힣]{2,15}(?:공사|공단|청|원|부|처|위원회|기관|연구원|협회|재단|조합))\s*(?:에서는?|는|이)\s/,
  );
  if (m) return m[1].trim();
  return UNCONFIRMED;
}

/** 명시적 제출서류 섹션 탐색 */
function extractDocumentSection(text: string): string[] {
  const sectionRe =
    /(?:\d+\.\s*)?(?:제출서류|입찰서류|구비서류)\s*[:：]?\s*\n([\s\S]+?)(?=\n\d+\.\s|\n\n|$)/i;
  const m = text.match(sectionRe);
  if (!m) return [];

  return m[1]
    .split('\n')
    .map((l) =>
      l
        .replace(/^[\s\-·•○●□■◆◇▶▷①②③④⑤⑥⑦⑧⑨⑩]+/, '')
        .replace(/^\s*[\d가-힣a-zA-Z]{1,3}[.)]\s*/, '')
        .trim(),
    )
    .filter((l) => l.length > 2 && l.length < 150);
}

/** 본문 전체에서 서류명 키워드(증명서·확인서·서약서 등) 추출 */
function extractDocumentKeywords(text: string): string[] {
  const seen = new Set<string>();
  const results: string[] = [];

  // 패턴1: 공백 없이 붙은 문서명 (예: 직접생산확인증명서, 청렴계약이행서약서)
  const re1 = /([가-힣·]{3,20}(?:증명서|확인서|서약서|신청서|동의서|보증서|납부증명|인감증명))/g;
  // 패턴2: 공백 1개 포함 (예: 국민연금 납부증명서, 중·소기업·소상공인 확인서)
  const re2 = /([가-힣·]{2,12}\s[가-힣·]{2,12}(?:증명서|확인서|납부증명|보험료))/g;

  for (const re of [re1, re2]) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      const raw = m[1].trim();
      if (raw.length < 4 || raw.length > 30) continue;
      if (!seen.has(raw)) { seen.add(raw); results.push(raw); }
    }
  }
  return results;
}

function extractDocuments(text: string): string[] {
  const section = extractDocumentSection(text);
  if (section.length > 0) return section;

  const keywords = extractDocumentKeywords(text);
  if (keywords.length > 0) return keywords;

  return [UNCONFIRMED];
}

export function parseText(rawText: string, id: string, fileName: string): ParsedAnnouncement {
  const t = normalizeText(rawText);

  const title = extract(t, [
    /\d+\.\s*공고명\s*[:：]\s*(.+)/,
    /공고명\s*[:：]\s*(.+)/,
    /용역명\s*[:：]\s*(.+)/,
    /사업명\s*[:：]\s*(.+)/,
  ]);

  const agency = extractAgency(t);

  const estimatedPrice = extract(t, [
    /예정금액\s*[:：]\s*[￦₩]?\s*([0-9,]+\s*(?:원|만원|천원)?)/,
    /추정가격\s*[:：]\s*[￦₩]?\s*([0-9,]+\s*(?:원|만원|천원)?)/,
    /예정가격\s*[:：]\s*[￦₩]?\s*([0-9,]+\s*(?:원|만원|천원)?)/,
    /기초금액\s*[:：]\s*[￦₩]?\s*([0-9,]+\s*(?:원|만원|천원)?)/,
  ]);

  const servicePeriod = extract(t, [
    /용역기간\s*[:：]\s*(.+)/,
    /계약기간\s*[:：]\s*(.+)/,
    /사업기간\s*[:：]\s*(.+)/,
    /이행기간\s*[:：]\s*(.+)/,
    /(\d{4}[년.]\s*\d{1,2}[월.]\s*\d{1,2}일?\s*[-~]\s*\d{4}[년.]\s*\d{1,2}[월.]\s*\d{1,2}일?)/,
  ]);

  const deadline = extract(t, [
    /전자입찰서\s*접수\s*마감일시\s*[:：]\s*(.+)/,
    /접수\s*마감일시\s*[:：]\s*(.+)/,
    /마감일시\s*[:：]\s*(.+)/,
    /입찰서\s*제출\s*마감\s*[:：]\s*(.+)/,
    /제출\s*마감일\s*[:：]\s*(.+)/,
  ]);

  const qualifications = extractSection(t, [
    /\d+\.\s*입찰참가자격[^\n]*\n([\s\S]+?)(?=\n\d+\.\s)/i,
    /입찰참가자격[^\n]*\n([\s\S]+?)(?=\n\d+\.\s)/i,
    /참가자격\s*[:：]\s*([\s\S]+?)(?=\n\d+\.|\n\n)/i,
  ]);

  const documents = extractDocuments(t);

  return {
    id,
    uploadedAt: new Date().toISOString(),
    fileName,
    rawText,
    title,
    agency,
    estimatedPrice,
    servicePeriod,
    deadline,
    qualifications,
    documents,
    manualEdits: {},
  };
}
