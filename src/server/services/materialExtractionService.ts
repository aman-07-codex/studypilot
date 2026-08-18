import * as mammoth from 'mammoth';
import * as pdfParseModule from 'pdf-parse';

const pdfParse = (pdfParseModule as any).default || pdfParseModule;

export class MaterialExtractionService {
  /**
   * Maximum characters to store. 250,000 characters is roughly 50,000-80,000 tokens, 
   * which gives plenty of semantic context for Gemini while avoiding Postgres TEXT bloat
   * for massive textbooks.
   */
  private static readonly MAX_CHARS = 250000;

  static async extractText(buffer: Buffer, mimeType: string): Promise<{ text: string, truncated: boolean }> {
    let rawText = '';

    if (mimeType === 'application/pdf') {
      const data = await pdfParse(buffer);
      rawText = data.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      mimeType === 'application/msword' // Also accept doc if it slips through somehow
    ) {
      // Mammoth extracts raw text, preserving basic paragraph structures
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    } else if (mimeType === 'text/plain') {
      rawText = buffer.toString('utf-8');
    } else {
      throw new Error(`Unsupported file type for extraction: ${mimeType}`);
    }

    if (!rawText || rawText.trim() === '') {
      throw new Error("Extracted text is empty. The file might be an image-only PDF without OCR data.");
    }

    // Normalize text
    // 1. Convert windows newlines to standard newlines
    let normalized = rawText.replace(/\r\n/g, '\n');
    // 2. Remove excessive newlines (max 2 consecutive, which preserves paragraphs)
    normalized = normalized.replace(/\n{3,}/g, '\n\n');
    // 3. Remove excessive spaces/tabs
    normalized = normalized.replace(/[ \t]{2,}/g, ' ');
    // 4. Trim ends
    normalized = normalized.trim();

    let truncated = false;
    if (normalized.length > this.MAX_CHARS) {
      normalized = normalized.substring(0, this.MAX_CHARS);
      truncated = true;
    }

    return { text: normalized, truncated };
  }
}
