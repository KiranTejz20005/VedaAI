import path from 'path';
import fs from 'fs/promises';
import type { IGeneratedPaper } from '../models/GeneratedPaper.model';
import { logger } from '../utils/logger';

export async function generatePdf(paper: IGeneratedPaper): Promise<{ pdfPath: string; pdfUrl: string }> {
  // Dynamic import to avoid loading Puppeteer at startup
  const puppeteer = await import('puppeteer-core');

  const html = buildPaperHtml(paper);

  const pdfDir = path.join(process.cwd(), 'uploads', 'pdfs');
  await fs.mkdir(pdfDir, { recursive: true });

  const fileName = `paper-${paper.assignmentId.toString()}-${Date.now()}.pdf`;
  const pdfPath = path.join(pdfDir, fileName);

  let browser;
  try {
    // Try to use system Chrome, fall back to puppeteer-bundled
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
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
    });

    logger.info(`PDF generated: ${fileName}`);
    const pdfUrl = `/api/papers/download/${fileName}`;
    return { pdfPath, pdfUrl };
  } finally {
    if (browser) await browser.close();
  }
}

function buildPaperHtml(paper: IGeneratedPaper): string {
  const meta = paper.canonicalMetadata;
  const schoolName = meta?.schoolName ?? 'School';
  const subject = meta?.subject ?? paper.title;
  const className = meta?.className ?? 'Not Specified';
  const duration = meta?.durationMinutes ?? paper.duration ?? 45;
  const maxMarks = meta?.generatedMarks ?? paper.totalMarks;
  const totalQuestions = paper.sections.reduce((sum, section) => sum + section.questions.length, 0);
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
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11.5pt; color: #222; margin: 0; padding: 0; line-height: 1.45; }
  .paper { width: 100%; }
  .school { text-align: center; font-size: 19pt; font-weight: 800; margin-bottom: 4px; }
  .exam-title { text-align: center; font-size: 14pt; font-weight: 700; margin-bottom: 2px; }
  .class-line { text-align: center; font-size: 12.5pt; font-weight: 700; margin-bottom: 22px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 11.5pt; font-weight: 700; margin: 0 0 18px; }
  .instruction-top { font-size: 11pt; font-weight: 700; margin: 0 0 18px; }
  .student-info { display: grid; grid-template-columns: 1.7fr 1fr 1.1fr; gap: 18px; margin: 0 0 28px; font-weight: 700; }
  .line { display: inline-block; min-width: 120px; border-bottom: 1px solid #222; height: 14px; vertical-align: baseline; }
  .section { margin-top: 26px; break-inside: auto; }
  .section h2 { text-align: center; font-size: 14pt; margin: 0 0 22px; font-weight: 800; break-after: avoid; page-break-after: avoid; }
  .instruction { font-size: 11pt; font-style: italic; margin: -8px 0 16px; break-after: avoid; page-break-after: avoid; }
  .questions { padding-left: 22px; margin: 0; }
  .question { margin-bottom: 13px; padding-left: 4px; break-inside: avoid; page-break-inside: avoid; }
  .q-header { display: flex; align-items: flex-start; gap: 12px; }
  .q-text { flex: 1; min-width: 0; }
  .difficulty { font-weight: 400; color: #333; }
  .q-marks { font-weight: 400; white-space: nowrap; margin-left: 10px; }
  .options { list-style: none; padding-left: 18px; margin: 7px 0 0; display: grid; gap: 4px; }
  .options li { break-inside: avoid; }
  .end-note { font-weight: 800; margin-top: 20px; }
  .answer-key { margin-top: 34px; padding-top: 20px; border-top: 1px solid #bbb; break-before: page; page-break-before: always; }
  .answer-key h2 { font-size: 14pt; margin: 0 0 14px; }
  .answer-key ol { margin: 0; padding-left: 22px; }
  .answer-key li { margin-bottom: 10px; }
  .footer { position: fixed; bottom: 8mm; left: 0; right: 0; text-align: center; font-size: 8.5pt; color: #777; }
  @page { size: A4; margin: 18mm 15mm 18mm; }
</style>
</head>
<body>
  <main class="paper">
    <div class="school">${escapeHtml(schoolName)}</div>
    <div class="exam-title">${escapeHtml(subject)}</div>
    <div class="class-line">Class: ${escapeHtml(className)}</div>
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
  <div class="footer">${totalQuestions} Questions | ${paper.totalMarks} Marks</div>
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
