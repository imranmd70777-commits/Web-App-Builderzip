import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetSubjects, useGetChapters, useBulkCreateMcqs } from "@workspace/api-client-react";
import { getGetChaptersQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import {
  Upload, FileText, ClipboardList, Pencil, Trash2, CheckCircle,
  AlertCircle, ChevronRight, ChevronLeft, Loader2, X, FileUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedMCQ {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

type Step = "input" | "preview" | "done";
type InputMode = "text" | "file";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function parseText(text: string): Promise<ParsedMCQ[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/mcqs/parse-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Parse failed");
  const data = await res.json();
  return data.mcqs;
}

async function parseFile(file: File): Promise<ParsedMCQ[]> {
  const token = localStorage.getItem("token");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/mcqs/parse-file`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Parse failed");
  const data = await res.json();
  return data.mcqs;
}

const optionLabels = ["A", "B", "C", "D"];
const difficulties = ["easy", "medium", "hard"] as const;

function EditRow({ mcq, idx, onChange, onDelete }: {
  mcq: ParsedMCQ; idx: number;
  onChange: (mcq: ParsedMCQ) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {idx + 1}
        </span>
        <div className="flex-1 min-w-0">
          <textarea
            value={mcq.question}
            onChange={e => onChange({ ...mcq, question: e.target.value })}
            rows={2}
            placeholder="Question text..."
            className="w-full text-sm bg-transparent border-0 outline-none resize-none placeholder:text-muted-foreground"
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            {mcq.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-1.5">
                <button
                  onClick={() => onChange({ ...mcq, correctOption: oi })}
                  className={cn(
                    "w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 border-2 transition-colors",
                    mcq.correctOption === oi
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-border text-muted-foreground hover:border-green-500/50"
                  )}
                >
                  {optionLabels[oi]}
                </button>
                <input
                  value={opt}
                  onChange={e => {
                    const o = [...mcq.options]; o[oi] = e.target.value;
                    onChange({ ...mcq, options: o });
                  }}
                  placeholder={`Option ${optionLabels[oi]}`}
                  className="flex-1 min-w-0 text-xs bg-transparent border-b border-border/50 outline-none py-0.5 placeholder:text-muted-foreground"
                />
              </div>
            ))}
          </div>
          {expanded && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1.5">
                {difficulties.map(d => (
                  <button key={d} onClick={() => onChange({ ...mcq, difficulty: d })}
                    className={cn("px-2.5 py-1 rounded text-xs font-medium capitalize border transition-colors", {
                      easy: mcq.difficulty === d ? "border-green-500 bg-green-500/10 text-green-400" : "border-border text-muted-foreground",
                      medium: mcq.difficulty === d ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-border text-muted-foreground",
                      hard: mcq.difficulty === d ? "border-red-500 bg-red-500/10 text-red-400" : "border-border text-muted-foreground",
                    }[d])}>
                    {d}
                  </button>
                ))}
              </div>
              <textarea
                value={mcq.explanation}
                onChange={e => onChange({ ...mcq, explanation: e.target.value })}
                rows={2}
                placeholder="Explanation (optional)..."
                className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 outline-none resize-none placeholder:text-muted-foreground"
              />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Expand/Edit">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-red-400 transition-colors" title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBulkImport() {
  const [step, setStep] = useState<Step>("input");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [pastedText, setPastedText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [mcqs, setMcqs] = useState<ParsedMCQ[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(0);
  const [selectedChapterId, setSelectedChapterId] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: subjects } = useGetSubjects();
  const { data: chapters } = useGetChapters(selectedSubjectId, {
    query: { queryKey: getGetChaptersQueryKey(selectedSubjectId), enabled: !!selectedSubjectId }
  });
  const bulkCreate = useBulkCreateMcqs();

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setParseError("");
  };

  const handleParse = async () => {
    setParseError("");
    setParsing(true);
    try {
      let parsed: ParsedMCQ[];
      if (inputMode === "text") {
        if (!pastedText.trim()) { setParseError("Please paste some MCQ text first."); return; }
        parsed = await parseText(pastedText);
      } else {
        if (!selectedFile) { setParseError("Please select a file first."); return; }
        parsed = await parseFile(selectedFile);
      }
      if (parsed.length === 0) {
        setParseError("No MCQs could be detected. Check the format and try again.");
        return;
      }
      setMcqs(parsed);
      setStep("preview");
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedChapterId) return;
    setSaving(true);
    try {
      const res = await bulkCreate.mutateAsync({
        data: {
          chapterId: selectedChapterId,
          mcqs: mcqs.filter(m => m.question && m.options.some(o => o)),
        }
      });
      setSavedCount(res.created);
      setStep("done");
    } catch {
      // error handled by mutation
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep("input"); setPastedText(""); setSelectedFile(null); setMcqs([]);
    setParseError(""); setSelectedSubjectId(0); setSelectedChapterId(0); setSavedCount(0);
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Bulk MCQ Import</h1>
          <p className="text-muted-foreground text-sm">Upload 50–500 questions at once from text, PDF, Word, or CSV/Excel</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(["input", "preview", "done"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                step === s ? "border-primary bg-primary text-white" :
                  i < ["input", "preview", "done"].indexOf(step) ? "border-green-500 bg-green-500/10 text-green-400" :
                    "border-border text-muted-foreground"
              )}>
                {i < ["input", "preview", "done"].indexOf(step) ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={cn("text-sm capitalize hidden sm:block", step === s ? "text-foreground font-medium" : "text-muted-foreground")}>
                {s === "input" ? "Import Source" : s === "preview" ? "Preview & Edit" : "Done"}
              </span>
              {i < 2 && <ChevronRight size={14} className="text-muted-foreground" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── Step 1: Input ────────────────────────────────────────────── */}
          {step === "input" && (
            <motion.div key="input" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              {/* Mode tabs */}
              <div className="flex gap-2 mb-6 p-1 bg-card border border-border rounded-xl w-fit">
                <button onClick={() => setInputMode("text")}
                  className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    inputMode === "text" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>
                  <ClipboardList size={15} /> Paste Text
                </button>
                <button onClick={() => setInputMode("file")}
                  className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    inputMode === "file" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>
                  <FileUp size={15} /> Upload File
                </button>
              </div>

              {inputMode === "text" ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-card/50 text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground mb-2">Supported text format:</p>
                    <p>1. What is the capital of France?</p>
                    <p>A) Paris &nbsp; B) London &nbsp; C) Berlin &nbsp; D) Madrid</p>
                    <p>Answer: A</p>
                    <p className="text-muted-foreground">Explanation: Paris is the capital of France.</p>
                  </div>
                  <textarea
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    rows={16}
                    placeholder={"Paste your MCQs here...\n\n1. Which planet is known as the Red Planet?\nA) Earth\nB) Mars\nC) Jupiter\nD) Saturn\nAnswer: B\nExplanation: Mars has a reddish appearance due to iron oxide on its surface."}
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-y font-mono placeholder:text-muted-foreground/60"
                  />
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors",
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-card/50"
                  )}>
                  <input ref={fileRef} type="file" className="hidden"
                    accept=".pdf,.docx,.doc,.csv,.xlsx,.xls,.txt"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  {selectedFile ? (
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                        <FileText size={28} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                        className="flex items-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-foreground">
                        <X size={12} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto">
                        <Upload size={24} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">Drop your file here or click to browse</p>
                        <p className="text-sm text-muted-foreground mt-1">PDF, DOCX, CSV, Excel (.xlsx), or plain text</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {parseError && (
                <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-red-400">
                  <AlertCircle size={16} /> {parseError}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button onClick={handleParse} disabled={parsing}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {parsing ? <><Loader2 size={15} className="animate-spin" /> Parsing...</> : <>Parse MCQs <ChevronRight size={15} /></>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 2: Preview & Edit ────────────────────────────────────── */}
          {step === "preview" && (
            <motion.div key="preview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <p className="font-semibold">{mcqs.length} MCQ{mcqs.length !== 1 ? "s" : ""} detected</p>
                  <p className="text-sm text-muted-foreground">Review and edit before saving. Click the pencil to expand each question.</p>
                </div>
                <div className="flex gap-2">
                  <select value={selectedSubjectId}
                    onChange={e => { setSelectedSubjectId(Number(e.target.value)); setSelectedChapterId(0); }}
                    className="px-3 py-2 rounded-lg bg-card border border-border text-sm outline-none focus:ring-2 focus:ring-primary/50">
                    <option value={0}>Select Subject</option>
                    {(subjects ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select value={selectedChapterId}
                    onChange={e => setSelectedChapterId(Number(e.target.value))}
                    disabled={!selectedSubjectId}
                    className="px-3 py-2 rounded-lg bg-card border border-border text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-40">
                    <option value={0}>Select Chapter</option>
                    {(chapters ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {mcqs.map((mcq, i) => (
                  <EditRow key={i} mcq={mcq} idx={i}
                    onChange={updated => setMcqs(prev => prev.map((m, j) => j === i ? updated : m))}
                    onDelete={() => setMcqs(prev => prev.filter((_, j) => j !== i))}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <button onClick={() => setStep("input")} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-secondary">
                  <ChevronLeft size={15} /> Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !selectedChapterId || mcqs.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <>Save {mcqs.length} MCQs</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: Done ──────────────────────────────────────────────── */}
          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>
              <p className="text-muted-foreground mb-8">
                {savedCount} MCQ{savedCount !== 1 ? "s" : ""} were successfully added to the database.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={reset} className="px-6 py-2.5 border border-border rounded-lg text-sm hover:bg-secondary">
                  Import More
                </button>
                <a href="/admin/mcqs" className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
                  View MCQs
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
