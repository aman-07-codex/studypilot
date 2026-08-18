import * as mammoth from 'mammoth';
import { Worker } from 'worker_threads';

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
      rawText = await this.extractPdfWithWorker(buffer);
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

  /**
   * Extracts PDF text using a dedicated Node.js worker thread.
   * This provides several production stability guarantees:
   * 1. Prevents pdfjs-dist from blocking the main Express event loop.
   * 2. Prevents memory leaks by aggressively terminating the worker upon completion.
   * 3. Prevents indefinite hangs with a strict 30-second timeout.
   */
  private static async extractPdfWithWorker(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const workerCode = `
        const { parentPort } = require('worker_threads');
        const { PDFParse } = require('pdf-parse');
        
        parentPort.on('message', async (buf) => {
          try {
            const parser = new PDFParse({ data: buf });
            const res = await parser.getText();
            await parser.destroy().catch(() => {});
            parentPort.postMessage({ success: true, text: res.text });
          } catch(e) {
            parentPort.postMessage({ success: false, error: e.message || String(e) });
          }
        });
      `;
      
      const worker = new Worker(workerCode, { eval: true });
      
      const timeout = setTimeout(() => {
        worker.terminate().catch(console.error);
        reject(new Error("PDF extraction timed out after 30 seconds. The file may be too large or malformed."));
      }, 30000);

      worker.on('message', (msg) => {
        clearTimeout(timeout);
        worker.terminate().catch(console.error);
        if (msg.success) {
          resolve(msg.text);
        } else {
          reject(new Error(msg.error));
        }
      });

      worker.on('error', (err) => {
        clearTimeout(timeout);
        worker.terminate().catch(console.error);
        reject(err);
      });

      worker.on('exit', (code) => {
        clearTimeout(timeout);
        if (code !== 0 && code !== 1) {
          reject(new Error(`PDF worker stopped unexpectedly with code ${code}`));
        }
      });

      worker.postMessage(buffer);
    });
  }
}
