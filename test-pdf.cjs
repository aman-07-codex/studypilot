const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function run() {
  const parser = new PDFParse({ data: Buffer.from('JVBERi0xLg==', 'base64') });
  try {
    const result = await parser.getText();
    console.log("Success:", result);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
