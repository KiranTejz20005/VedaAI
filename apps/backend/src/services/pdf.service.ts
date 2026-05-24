import { env } from '../config/env';
import type { IGeneratedPaper } from '../models/GeneratedPaper.model';
import { logger } from '../utils/logger';
import { validatePaperOrThrow } from '../validators/paper.validator';
import { getPdfStorage } from './storage';

export async function generatePdf(paper: IGeneratedPaper): Promise<{ pdfPath: string; pdfUrl: string }> {
  validatePaperOrThrow(paper);

  // Dynamic import to avoid loading Puppeteer at startup
  const puppeteer = await import('puppeteer-core');

  const html = buildPaperHtml(paper);

  const storage = getPdfStorage();
  const fileName = `paper-${paper.assignmentId.toString()}-${Date.now()}.pdf`;

  let browser;
  try {
    const executablePath = process.env.CHROMIUM_PATH ||
      (process.env.NODE_ENV === 'production'
        ? await import('@sparticuz/chromium').then((m) => m.default.executablePath())
        : undefined);

    browser = await puppeteer.default.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: typeof executablePath === 'string' ? executablePath : undefined,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    const meta = paper.canonicalMetadata;
    const headerSchool = escapeHtml(meta?.schoolName?.trim() || 'School Examination');
    const headerSubject = escapeHtml(meta?.subject?.trim() || paper.title);
    const headerClass = meta?.className?.trim()
      ? `<span style="margin-left:8px;">| Class ${escapeHtml(meta.className)}</span>`
      : '';

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '22mm', right: '15mm', bottom: '18mm', left: '15mm' },
      printBackground: true,
      timeout: 60_000,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width:100%;font-size:9px;font-family:'Times New Roman',serif;color:#444;padding:0 15mm;display:flex;justify-content:space-between;">
          <span>${headerSchool}</span>
          <span>${headerSubject}${headerClass}</span>
        </div>`,
      footerTemplate: `
        <div style="width:100%;font-size:9px;font-family:Arial,sans-serif;color:#666;padding:0 15mm;text-align:center;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
    });

    const pdfUrl = await storage.save(fileName, pdfBuffer, 'application/pdf');
    const pdfPath = pdfUrl.startsWith('http')
      ? pdfUrl
      : `${env.UPLOAD_DIR}/pdfs/${fileName}`;
    logger.info(`PDF generated: ${fileName}`);
    return { pdfPath, pdfUrl };
  } finally {
    if (browser) await browser.close();
  }
}

function buildPaperHtml(paper: IGeneratedPaper): string {
  const meta = paper.canonicalMetadata;
  const schoolName = meta?.schoolName?.trim() || 'School Examination';
  const examTitle = paper.title?.trim() || 'Question Paper';
  const subject = meta?.subject?.trim() || examTitle;
  const className = meta?.className?.trim() || '';
  const duration = meta?.durationMinutes || paper.duration || 45;
  const maxMarks = meta?.generatedMarks || paper.totalMarks;
  const sectionsHtml = paper.sections
    .map(
      (section, sIdx) => `
      <section class="section">
        <h2>${escapeHtml(section.title)}</h2>
        ${section.instruction ? `<p class="instruction">${escapeHtml(section.instruction)}</p>` : ''}
        <ol class="questions" start="${getStartNumber(paper, sIdx)}">
          ${section.questions
            .map(
              (q) => `
            <li class="question">
              <div class="q-header">
                <span class="q-text"><span class="difficulty">[${formatDifficulty(q.difficulty)}]</span> ${escapeHtml(q.question)}</span>
                <span class="q-marks">[${formatMarks(q.marks)}]</span>
              </div>
              ${q.type === 'mcq' && q.options
                ? `<ul class="options">${q.options.map((o) => `<li><strong>${escapeHtml(o.key)}.</strong> ${escapeHtml(o.text)}</li>`).join('')}</ul>`
                : ''}
            </li>`
            )
            .join('')}
        </ol>
      </section>`
    )
    .join('');

  const answerHtml = buildAnswerKeyHtml(paper);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; line-height: 1.5; }
  .paper { width: 100%; padding: 0 2mm; }
  .header { text-align: center; margin-bottom: 6mm; }
  .school { font-size: 18pt; font-weight: 800; letter-spacing: 0.5px; }
  .exam-title { font-size: 14pt; font-weight: 700; margin-top: 2mm; }
  .class-line { font-size: 12pt; font-weight: 700; margin-top: 1mm; }
  .meta-row { display: flex; justify-content: space-between; font-size: 11pt; font-weight: 700; border-bottom: 2px solid #000; padding-bottom: 3mm; margin: 4mm 0; }
  .instruction-top { font-size: 11pt; font-weight: 700; margin-bottom: 4mm; }
  .student-info { display: grid; grid-template-columns: 1.7fr 1fr 1.1fr; gap: 4mm; margin-bottom: 6mm; font-weight: 700; }
  .line { display: inline-block; min-width: 30mm; border-bottom: 1px solid #000; height: 12px; vertical-align: baseline; }
  .section { margin-top: 6mm; }
  .section h2 { text-align: center; font-size: 14pt; margin-bottom: 4mm; font-weight: 800; }
  .instruction { font-size: 11pt; font-style: italic; margin-bottom: 3mm; }
  .questions { padding-left: 8mm; margin: 0; }
  .question { margin-bottom: 3mm; padding-left: 2mm; }
  .q-header { display: flex; align-items: flex-start; gap: 3mm; }
  .q-text { flex: 1; }
  .difficulty { font-weight: 400; color: #555; font-size: 10pt; }
  .q-marks { font-weight: 400; white-space: nowrap; font-size: 11pt; }
  .options { list-style: none; padding-left: 6mm; margin: 2mm 0 0; }
  .options li { margin-bottom: 1mm; }
  .end-note { font-weight: 800; text-align: center; border-top: 2px solid #000; padding-top: 3mm; margin-top: 6mm; }
  .answer-key { margin-top: 8mm; padding-top: 4mm; border-top: 2px solid #000; }
  .answer-key h2 { font-size: 14pt; margin-bottom: 3mm; }
  .answer-key ol { margin: 0; padding-left: 8mm; }
  .answer-key li { margin-bottom: 2mm; }
  .answer-key { page-break-before: always; break-before: page; }
  .section { page-break-inside: avoid; break-inside: avoid-page; }
  .question { page-break-inside: avoid; break-inside: avoid-page; }
  @page { size: A4; margin: 18mm 16mm 22mm; }
</style>
</head>
<body>
  <main class="paper">
    <div class="header">
      <div class="school">${escapeHtml(schoolName)}</div>
      <div class="exam-title">${escapeHtml(examTitle)}</div>
      <div class="class-line">Subject: ${escapeHtml(subject)}${className ? ` &nbsp;|&nbsp; Class: ${escapeHtml(className)}` : ''}</div>
    </div>
    <div class="meta-row">
      <span>Time Allowed: ${duration} minutes</span>
      <span>Maximum Marks: ${maxMarks}</span>
    </div>
    <p class="instruction-top">All questions are compulsory unless stated otherwise.</p>
    <div class="student-info">
      <div>Name: <span class="line"></span></div>
      <div>Roll Number: <span class="line"></span></div>
      <div>Section: <span class="line"></span></div>
    </div>
    ${sectionsHtml}
    <p class="end-note">End of Question Paper</p>
    ${answerHtml}
  </main>
</body>
</html>`;
}

function getStartNumber(paper: IGeneratedPaper, sectionIndex: number): number {
  let total = 1;
  for (let i = 0; i < sectionIndex; i++) {
    total += paper.sections[i]?.questions.length ?? 0;
  }
  return total;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMarks(marks: number): string {
  return `${marks} ${marks === 1 ? 'Mark' : 'Marks'}`;
}

function formatDifficulty(value: string): string {
  if (value === 'hard') return 'Challenging';
  if (value === 'medium') return 'Moderate';
  return 'Easy';
}

function buildAnswerKeyHtml(paper: IGeneratedPaper): string {
  const answers = paper.sections
    .flatMap((section) => section.questions)
    .map((question, index) => ({ number: index + 1, answer: question.answer }))
    .filter((item) => item.answer?.text);

  if (answers.length === 0) return '';

  return `
    <section class="answer-key">
      <h2>Answer Key</h2>
      <ol>
        ${answers
          .map(({ answer }) => `<li>${escapeHtml(answer?.text)}${answer?.explanation ? `<br><span>${escapeHtml(answer.explanation)}</span>` : ''}</li>`)
          .join('')}
      </ol>
    </section>`;
}
