import { Router, type Request } from "express";
// multer v2 ships no @types — use require so TS doesn't inspect the module
// eslint-disable-next-line @typescript-eslint/no-require-imports
const multer = require("multer") as {
  (opts: { storage: unknown; limits?: unknown }): {
    single: (field: string) => (req: Request, res: unknown, next: (e?: unknown) => void) => void;
  };
  memoryStorage: () => unknown;
};
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── Multer-augmented request ─────────────────────────────────────────────────
interface UploadRequest extends Request {
  file?: {
    mimetype: string;
    originalname: string;
    buffer: Buffer;
    size: number;
  };
}

// ── MCQ text parser ──────────────────────────────────────────────────────────

export interface ParsedMCQ {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

function stripLeadingNumber(line: string): string {
  return line.replace(/^[ \t]*(?:\d{1,3}[\.\)]\s*|Q\.?\s*\d+[\.\):\s]*)/i, "").trim();
}

function parseSingleBlock(block: string): ParsedMCQ | null {
  const lines = block.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 3) return null;

  const questionLines: string[] = [];
  const options: string[] = [];
  let correctOption = -1;
  let explanationParts: string[] = [];
  let afterOptions = false;

  // Option: A) / A. / A- / (A) / [A]
  const optRegex = /^(?:\(([A-Da-d])\)|([A-Da-d])[\.\)\-])\s*(\*?)(.+)/;
  const ansRegex = /^(?:ans(?:wer)?|correct(?:\s+ans(?:wer)?)?|key|solution|ans\.?)[\s:\-\.]+([A-Da-d1-4])/i;
  const expRegex = /^(?:explanation|exp|rationale|note|reason|solution)[\s:\-\.]+(.+)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const aMatch = line.match(ansRegex);
    if (aMatch) {
      const ans = aMatch[1].toUpperCase();
      correctOption = "ABCD".includes(ans) ? "ABCD".indexOf(ans) : parseInt(ans) - 1;
      afterOptions = true;
      continue;
    }

    const eMatch = line.match(expRegex);
    if (eMatch) {
      explanationParts.push(eMatch[1]);
      for (let j = i + 1; j < lines.length; j++) explanationParts.push(lines[j]);
      break;
    }

    const oMatch = line.match(optRegex);
    if (oMatch && options.length < 4) {
      const star = oMatch[3];
      const text = oMatch[4].trim();
      if (star) correctOption = options.length;
      options.push(text);
      afterOptions = true;
      continue;
    }

    if (!afterOptions) {
      const stripped = stripLeadingNumber(line);
      if (stripped) questionLines.push(stripped);
    }
  }

  const question = questionLines.join(" ").trim();
  if (!question || options.length < 2) return null;

  while (options.length < 4) options.push("");
  if (correctOption < 0 || correctOption >= 4) correctOption = 0;

  return {
    question,
    options: options.slice(0, 4),
    correctOption,
    explanation: explanationParts.join(" ").trim(),
    difficulty: "medium",
  };
}

export function parseMCQsFromText(text: string): ParsedMCQ[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parts = normalized.split(/\n(?=[ \t]*(?:\d{1,3}[\.\)]\s|Q\.?\s*\d+[\.\):\s]))/i);
  return parts
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(parseSingleBlock)
    .filter((m): m is ParsedMCQ => m !== null);
}

function parseMCQsFromCSV(text: string): ParsedMCQ[] {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l);
  if (lines.length < 2) return [];

  const delim = lines[0].includes("\t") ? "\t" : ",";

  const splitLine = (line: string): string[] => {
    if (delim !== ",") return line.split("\t").map(s => s.trim());
    const result: string[] = [];
    let cur = "";
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { result.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    result.push(cur.trim());
    return result;
  };

  const headers = splitLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const qIdx = headers.findIndex(h => ["question", "q", "questiontext"].includes(h)) ?? 0;
  const ansIdx = headers.findIndex(h => ["answer", "ans", "correct", "correctanswer", "correctoption"].includes(h));
  const expIdx = headers.findIndex(h => ["explanation", "exp", "rationale"].includes(h));

  const optCandidates = ["optiona", "optionb", "optionc", "optiond", "a", "b", "c", "d",
    "opt1", "opt2", "opt3", "opt4", "option1", "option2", "option3", "option4"];
  const optIndices: number[] = [];
  for (const h of optCandidates) {
    const idx = headers.indexOf(h);
    if (idx >= 0 && !optIndices.includes(idx) && optIndices.length < 4) optIndices.push(idx);
  }

  const results: ParsedMCQ[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitLine(line);
    if (cols.every(c => !c)) continue;
    const question = (qIdx >= 0 ? cols[qIdx] : cols[0]) ?? "";
    if (!question) continue;
    const opts = optIndices.length >= 2
      ? optIndices.map(i => (cols[i] ?? "").trim())
      : [cols[1] ?? "", cols[2] ?? "", cols[3] ?? "", cols[4] ?? ""].map(s => s.trim());
    while (opts.length < 4) opts.push("");
    let correctOption = 0;
    if (ansIdx >= 0) {
      const ans = (cols[ansIdx] ?? "A").trim().toUpperCase();
      correctOption = "ABCD".includes(ans) ? "ABCD".indexOf(ans) : Math.max(0, parseInt(ans) - 1);
    }
    results.push({
      question: question.trim(),
      options: opts.slice(0, 4),
      correctOption: Math.min(correctOption || 0, 3),
      explanation: expIdx >= 0 ? (cols[expIdx] ?? "").trim() : "",
      difficulty: "medium",
    });
  }
  return results;
}

// ── Routes ───────────────────────────────────────────────────────────────────

router.post("/mcqs/parse-text", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "text is required" });
    return;
  }
  const mcqs = parseMCQsFromText(text);
  res.json({ mcqs, count: mcqs.length });
});

router.post(
  "/mcqs/parse-file",
  requireAuth,
  requireAdmin,
  upload.single("file"),
  async (req: UploadRequest, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "file is required" });
      return;
    }

    const { mimetype, originalname, buffer } = req.file;
    const ext = (originalname.split(".").pop() ?? "").toLowerCase();

    try {
      let mcqs: ParsedMCQ[] = [];

      if (ext === "csv" || mimetype === "text/csv") {
        mcqs = parseMCQsFromCSV(buffer.toString("utf-8"));

      } else if (["xlsx", "xls"].includes(ext) || mimetype.includes("spreadsheet") || mimetype.includes("excel")) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(buffer, { type: "buffer" });
        const csv: string = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
        mcqs = parseMCQsFromCSV(csv);

      } else if (ext === "pdf" || mimetype === "application/pdf") {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        mcqs = parseMCQsFromText(result.text);

      } else if (ext === "docx" || mimetype.includes("wordprocessingml")) {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        mcqs = parseMCQsFromText(result.value);

      } else if (ext === "txt" || mimetype.startsWith("text/")) {
        mcqs = parseMCQsFromText(buffer.toString("utf-8"));

      } else {
        res.status(400).json({ error: `Unsupported file type: .${ext}` });
        return;
      }

      res.json({ mcqs, count: mcqs.length });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Parse failed";
      res.status(500).json({ error: `Failed to parse file: ${msg}` });
    }
  }
);

export default router;
