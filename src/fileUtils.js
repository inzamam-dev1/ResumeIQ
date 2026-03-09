// ─── File utilities — PDF extraction using PDF.js (runs in browser) ───────────
// PDF.js is loaded from CDN — no install needed, works offline

// ── Load PDF.js from CDN ──────────────────────────────────────────────────────
async function loadPDFJS() {
  if (window.pdfjsLib) return window.pdfjsLib;

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload  = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  // Set worker URL
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  return window.pdfjsLib;
}

// ── Extract all text from a PDF file ─────────────────────────────────────────
async function extractTextFromPDF(file) {
  const pdfjsLib = await loadPDFJS();

  // Read file as ArrayBuffer
  const arrayBuffer = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  // Load the PDF
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const textPages = [];

  // Extract text from each page
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page    = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(" ");
    textPages.push(pageText);
  }

  const fullText = textPages.join("\n\n").trim();

  if (!fullText) {
    throw new Error(
      "This PDF appears to be a scanned image and cannot be read as text. " +
      "Please copy and paste your resume text directly."
    );
  }

  return fullText;
}

// ── Read plain text file ──────────────────────────────────────────────────────
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// ── Main export: extract text from any supported file type ───────────────────
export async function extractTextFromUpload(file) {
  const isPDF = file.type === "application/pdf" ||
                file.name.toLowerCase().endsWith(".pdf");

  const isDOC = file.name.toLowerCase().endsWith(".doc") ||
                file.name.toLowerCase().endsWith(".docx");

  if (isPDF) {
    return extractTextFromPDF(file);
  }

  if (isDOC) {
    // DOC/DOCX files — read as text (works for simple .doc files)
    // For full .docx support, mammoth.js would be needed
    try {
      const text = await readFileAsText(file);
      if (text && text.trim().length > 50) return text;
      throw new Error("DOC file could not be read as text");
    } catch {
      throw new Error(
        "Could not read this Word document. " +
        "Please save it as a .txt file or copy-paste the text directly."
      );
    }
  }

  // Plain text (.txt)
  return readFileAsText(file);
}
