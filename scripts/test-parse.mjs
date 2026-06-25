import { readFileSync } from 'fs';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
GlobalWorkerOptions.workerSrc = new URL(
  '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
  import.meta.url,
).href;

const buf = readFileSync('docs/공고문.pdf');
const pdf = await getDocument({
  data: new Uint8Array(buf),
  useWorkerFetch: false,
  isEvalSupported: false,
  useSystemFonts: true,
}).promise;

let rawText = '';
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const content = await page.getTextContent();
  rawText += content.items.map((it) => it.str).join(' ') + '\n';
}

// ── normalizeText (parser.ts 와 동일) ─────────────────────
function normalizeText(raw) {
  return raw
    .replace(/\s{2,}(\d{1,2}\.)\s/g, '\n$1 ')
    .replace(/\s{2,}([가나다라마바사아자차]\.)\s/g, '\n$1 ')
    .replace(/\s{2,}([○●□■◆▶➲※])\s/g, '\n$1 ')
    .replace(/\s{3,}/g, '\n');
}

function firstLine(str) {
  return str
    .split('\n')[0]
    .split(/\s{2,}/)[0]
    .replace(/\s+[가나다라마바사아자차]\.\s.*$/, '')
    .replace(/\s+-\s+.*$/, '')
    .trim();
}

function extract(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const val = m.slice(1).find((g) => g && g.trim().length > 0) ?? '';
      const clean = firstLine(val.trim());
      if (clean.length > 0) return clean;
    }
  }
  return '미확인';
}

function extractSection(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const val = m.slice(1).find((g) => g && g.trim().length > 0) ?? '';
      const trimmed = val.trim().slice(0, 300);
      if (trimmed.length > 0) return trimmed;
    }
  }
  return '미확인';
}

function extractAgency(text) {
  const explicit = extract(text, [
    /발주기관\s*[:：]\s*(.+)/,
    /수요기관\s*[:：]\s*(.+)/,
    /기관명\s*[:：]\s*(.+)/,
  ]);
  if (!explicit.includes('미확인')) return explicit;
  const m = text.match(
    /([가-힣]{2,15}(?:공사|공단|청|원|부|처|위원회|기관|연구원|협회|재단|조합))\s*(?:에서는?|는|이)\s/,
  );
  return m ? m[1].trim() : '미확인';
}

function extractDocumentSection(text) {
  const sectionRe = /(?:\d+\.\s*)?(?:제출서류|입찰서류|구비서류)\s*[:：]?\s*\n([\s\S]+?)(?=\n\d+\.\s|\n\n|$)/i;
  const m = text.match(sectionRe);
  if (!m) return [];
  return m[1].split('\n')
    .map(l => l.replace(/^[\s\-·•○●□■◆▶➢※]+/, '').replace(/^\s*[\d가-힣a-zA-Z]{1,3}[.)]\s*/, '').trim())
    .filter(l => l.length > 2 && l.length < 150);
}

function extractDocumentKeywords(text) {
  const seen = new Set();
  const results = [];
  const re1 = /([가-힣·]{3,20}(?:증명서|확인서|서약서|신청서|동의서|보증서|납부증명|인감증명))/g;
  const re2 = /([가-힣·]{2,12}\s[가-힣·]{2,12}(?:증명서|확인서|납부증명|보험료))/g;
  for (const re of [re1, re2]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const raw = m[1].trim();
      if (raw.length < 4 || raw.length > 30) continue;
      if (!seen.has(raw)) { seen.add(raw); results.push(raw); }
    }
  }
  return results;
}

function extractDocuments(text) {
  const section = extractDocumentSection(text);
  if (section.length > 0) return section;
  const keywords = extractDocumentKeywords(text);
  if (keywords.length > 0) return keywords;
  return ['미확인'];
}

const t = normalizeText(rawText);

const title = extract(t, [
  /\d+\.\s*공고명\s*[:：]\s*(.+)/,
  /공고명\s*[:：]\s*(.+)/,
  /용역명\s*[:：]\s*(.+)/,
]);

const agency = extractAgency(t);

const estimatedPrice = extract(t, [
  /예정금액\s*[:：]\s*[￦₩]?\s*([0-9,]+\s*(?:원|만원|천원)?)/,
  /추정가격\s*[:：]\s*[￦₩]?\s*([0-9,]+\s*(?:원|만원|천원)?)/,
  /기초금액\s*[:：]\s*[￦₩]?\s*([0-9,]+\s*(?:원|만원|천원)?)/,
]);

const servicePeriod = extract(t, [
  /용역기간\s*[:：]\s*(.+)/,
  /계약기간\s*[:：]\s*(.+)/,
]);

const deadline = extract(t, [
  /전자입찰서\s*접수\s*마감일시\s*[:：]\s*(.+)/,
  /접수\s*마감일시\s*[:：]\s*(.+)/,
  /마감일시\s*[:：]\s*(.+)/,
]);

const qualifications = extractSection(t, [
  /\d+\.\s*입찰참가자격[^\n]*\n([\s\S]+?)(?=\n\d+\.\s)/i,
  /입찰참가자격[^\n]*\n([\s\S]+?)(?=\n\d+\.\s)/i,
]);

const documents = extractDocuments(t);

console.log('\n=== 파싱 결과 ===\n');
console.log('공고명     :', title);
console.log('발주기관   :', agency);
console.log('예정금액   :', estimatedPrice);
console.log('용역기간   :', servicePeriod);
console.log('마감일시   :', deadline);
console.log('참가자격   :', qualifications.slice(0, 200).replace(/\n/g, ' ↵ '));
console.log('제출서류   :', documents.slice(0, 5));
