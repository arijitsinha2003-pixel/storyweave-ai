import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { StoryRecord } from '../types/story';

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const PAGE_PADDING_X = 58;
const PAGE_PADDING_TOP = 54;
const PAGE_PADDING_BOTTOM = 64;
const CONTENT_WIDTH_PX = A4_WIDTH_PX - PAGE_PADDING_X * 2;
const MAX_CONTENT_HEIGHT_PX = A4_HEIGHT_PX - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM;

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeFileName(title: string): string {
  const cleaned = title
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 72);
  return cleaned || 'StoryWeave_Story';
}

function splitOversizedParagraph(text: string, maxChars = 900): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return [trimmed];

  const sentences = trimmed.match(/[^.!?।॥]+[.!?।॥]*/g) ?? [trimmed];
  const parts: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const piece = sentence.trim();
    if (!piece) continue;
    if ((current + ' ' + piece).trim().length <= maxChars) {
      current = current ? `${current} ${piece}` : piece;
    } else {
      if (current) parts.push(current);
      if (piece.length <= maxChars) {
        current = piece;
      } else {
        for (let i = 0; i < piece.length; i += maxChars) {
          parts.push(piece.slice(i, i + maxChars));
        }
        current = '';
      }
    }
  }
  if (current) parts.push(current);
  return parts.length > 0 ? parts : [trimmed];
}

function buildBlockHtmlList(story: StoryRecord): string[] {
  const blocks: string[] = [];

  const metaParts = [
    story.genre,
    story.tone,
    story.writingStyle,
    story.wordCount ? `${story.wordCount.toLocaleString()} words` : '',
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join(' &nbsp;&middot;&nbsp; ');

  blocks.push(`
    <div class="pdf-block pdf-header">
      <div class="pdf-brand">STORYWEAVE MANUSCRIPT</div>
      <h1 class="pdf-title">${escapeHtml(story.title || 'Untitled Story')}</h1>
      ${metaParts ? `<div class="pdf-meta">${metaParts}</div>` : ''}
      ${
        story.description?.trim()
          ? `<p class="pdf-synopsis">${escapeHtml(story.description.trim())}</p>`
          : ''
      }
      <div class="pdf-divider"></div>
    </div>
  `);

  const rawParagraphs = (story.narrative || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const paragraphs = rawParagraphs.flatMap((p) => splitOversizedParagraph(p));

  if (paragraphs.length > 0) {
    blocks.push(`
      <div class="pdf-block pdf-section-label">STORY</div>
    `);
    for (const para of paragraphs) {
      blocks.push(`
        <p class="pdf-block pdf-paragraph">${escapeHtml(para)}</p>
      `);
    }
  }

  if (story.characterDetails && story.characterDetails.length > 0) {
    const cardsHtml = story.characterDetails
      .map(
        (c) => `
        <div class="pdf-char-card">
          <div class="pdf-char-name">${escapeHtml(c.name)}</div>
          <div class="pdf-char-role">${escapeHtml(c.role)}</div>
          <div class="pdf-char-trait">${escapeHtml(c.trait)}</div>
        </div>
      `
      )
      .join('');

    blocks.push(`
      <div class="pdf-block pdf-section-box">
        <div class="pdf-section-label">CHARACTERS</div>
        <div class="pdf-char-grid">${cardsHtml}</div>
      </div>
    `);
  } else if (story.characters && story.characters.length > 0) {
    blocks.push(`
      <div class="pdf-block pdf-section-box">
        <div class="pdf-section-label">CHARACTERS</div>
        <p class="pdf-arc-text">${escapeHtml(story.characters.join(' · '))}</p>
      </div>
    `);
  }

  const arcItems: { label: string; value: string }[] = [];
  if (story.conflict?.trim()) arcItems.push({ label: 'CONFLICT', value: story.conflict.trim() });
  if (story.climax?.trim()) arcItems.push({ label: 'CLIMAX', value: story.climax.trim() });
  if (story.resolution?.trim())
    arcItems.push({ label: 'RESOLUTION', value: story.resolution.trim() });

  if (arcItems.length > 0) {
    const arcCards = arcItems
      .map(
        (item) => `
        <div class="pdf-arc-item">
          <div class="pdf-arc-label">${item.label}</div>
          <p class="pdf-arc-text">${escapeHtml(item.value)}</p>
        </div>
      `
      )
      .join('');

    blocks.push(`
      <div class="pdf-block pdf-section-box">
        <div class="pdf-section-label">NARRATIVE ARC</div>
        <div class="pdf-arc-list">${arcCards}</div>
      </div>
    `);
  }

  return blocks;
}

export async function exportStoryToPdf(story: StoryRecord): Promise<void> {
  if (typeof document === 'undefined') {
    throw new Error('PDF export is only available in the browser.');
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = `${A4_WIDTH_PX}px`;
  iframe.style.height = `${A4_HEIGHT_PX}px`;
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    if (!doc) {
      throw new Error('Unable to initialize PDF rendering frame.');
    }

    const blocksHtml = buildBlockHtmlList(story).join('\n');

    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #ffffff;
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Devanagari", "Noto Sans Bengali", "Noto Sans Tamil", "Noto Sans Telugu", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    #staging {
      width: ${CONTENT_WIDTH_PX}px;
      visibility: hidden;
    }
    .pdf-page {
      width: ${A4_WIDTH_PX}px;
      height: ${A4_HEIGHT_PX}px;
      background: #ffffff;
      padding: ${PAGE_PADDING_TOP}px ${PAGE_PADDING_X}px ${PAGE_PADDING_BOTTOM}px ${PAGE_PADDING_X}px;
      position: relative;
      overflow: hidden;
    }
    .pdf-page-content {
      width: ${CONTENT_WIDTH_PX}px;
    }
    .pdf-footer {
      position: absolute;
      left: ${PAGE_PADDING_X}px;
      right: ${PAGE_PADDING_X}px;
      bottom: 26px;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #6b7280;
    }
    .pdf-brand {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.14em;
      color: #6d28d9;
      margin-bottom: 8px;
    }
    .pdf-title {
      font-size: 25px;
      line-height: 1.25;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
      font-family: Georgia, "Times New Roman", "Noto Serif", "Noto Serif Devanagari", "Noto Serif Bengali", "Noto Serif Tamil", "Noto Serif Telugu", serif;
    }
    .pdf-meta {
      font-size: 11.5px;
      font-weight: 600;
      color: #5b21b6;
      margin-bottom: 12px;
    }
    .pdf-synopsis {
      font-size: 13px;
      line-height: 1.6;
      color: #4b5563;
      background: #f5f3ff;
      border-left: 3px solid #7c3aed;
      padding: 10px 14px;
      border-radius: 4px;
      margin-bottom: 14px;
    }
    .pdf-divider {
      height: 1px;
      background: #e5e7eb;
      margin-bottom: 16px;
    }
    .pdf-section-label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #6d28d9;
      margin-bottom: 10px;
    }
    .pdf-paragraph {
      font-size: 13.8px;
      line-height: 1.75;
      color: #1f2937;
      margin-bottom: 12px;
      font-family: Georgia, "Times New Roman", "Noto Serif", "Noto Serif Devanagari", "Noto Serif Bengali", "Noto Serif Tamil", "Noto Serif Telugu", serif;
      white-space: pre-wrap;
    }
    .pdf-section-box {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .pdf-char-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .pdf-char-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .pdf-char-name {
      font-size: 12.5px;
      font-weight: 700;
      color: #111827;
    }
    .pdf-char-role {
      font-size: 11px;
      font-weight: 600;
      color: #6d28d9;
      margin-top: 2px;
      margin-bottom: 4px;
    }
    .pdf-char-trait {
      font-size: 11.5px;
      line-height: 1.5;
      color: #4b5563;
    }
    .pdf-arc-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .pdf-arc-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .pdf-arc-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #6d28d9;
      margin-bottom: 4px;
    }
    .pdf-arc-text {
      font-size: 12px;
      line-height: 1.55;
      color: #374151;
    }
  </style>
</head>
<body>
  <div id="staging">${blocksHtml}</div>
  <div id="pages"></div>
</body>
</html>`);
    doc.close();

    // Wait a tick for layout & webfont metrics inside the isolated frame
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 60)));

    const staging = doc.getElementById('staging');
    const pagesContainer = doc.getElementById('pages');
    if (!staging || !pagesContainer) {
      throw new Error('Failed to build PDF pages.');
    }

    const blockEls = Array.from(staging.children) as HTMLElement[];
    const pageGroups: HTMLElement[][] = [];
    let currentGroup: HTMLElement[] = [];
    let currentHeight = 0;

    for (const el of blockEls) {
      const style = iframe.contentWindow?.getComputedStyle(el);
      const marginTop = style ? parseFloat(style.marginTop) || 0 : 0;
      const marginBottom = style ? parseFloat(style.marginBottom) || 0 : 0;
      const elTotalHeight = el.offsetHeight + marginTop + marginBottom;

      if (
        currentGroup.length > 0 &&
        currentHeight + elTotalHeight > MAX_CONTENT_HEIGHT_PX
      ) {
        pageGroups.push(currentGroup);
        currentGroup = [el];
        currentHeight = elTotalHeight;
      } else {
        currentGroup.push(el);
        currentHeight += elTotalHeight;
      }
    }
    if (currentGroup.length > 0) {
      pageGroups.push(currentGroup);
    }

    staging.style.display = 'none';
    const totalPages = pageGroups.length;
    const safeTitle = escapeHtml(story.title || 'Untitled Story');

    const pageElements: HTMLElement[] = pageGroups.map((group, index) => {
      const pageEl = doc.createElement('div');
      pageEl.className = 'pdf-page';

      const contentEl = doc.createElement('div');
      contentEl.className = 'pdf-page-content';
      for (const node of group) {
        contentEl.appendChild(node.cloneNode(true));
      }
      pageEl.appendChild(contentEl);

      const footerEl = doc.createElement('div');
      footerEl.className = 'pdf-footer';
      footerEl.innerHTML = `<span>StoryWeave &middot; ${safeTitle}</span><span>Page ${index + 1} of ${totalPages}</span>`;
      pageEl.appendChild(footerEl);

      pagesContainer.appendChild(pageEl);
      return pageEl;
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: true,
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pageElements.length; i++) {
      const canvas = await html2canvas(pageElements[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: A4_WIDTH_PX,
        windowHeight: A4_HEIGHT_PX,
      });

      if (i > 0) {
        pdf.addPage();
      }
      const imgData = canvas.toDataURL('image/jpeg', 0.94);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    pdf.save(`${sanitizeFileName(story.title)}.pdf`);
  } finally {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}
