import { useState } from "react";
import { motion } from "framer-motion";
import { useGetSubjects, useGetChapters, useGetMcqs, useCreateMcq, useUpdateMcq, useDeleteMcq } from "@workspace/api-client-react";
import { getGetChaptersQueryKey, getGetMcqsQueryKey } from "@workspace/api-client-react";
import type { Mcq } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { Plus, Pencil, Trash2, Zap, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function McqModal({ mcq, onClose, onSave }: { mcq?: Mcq | null; onClose: () => void; onSave: () => void }) {
  const { data: subjects } = useGetSubjects();
  const [subjectId, setSubjectId] = useState<number>(mcq?.subjectId ?? 0);
  const { data: chapters } = useGetChapters(subjectId, {
    query: { queryKey: getGetChaptersQueryKey(subjectId), enabled: !!subjectId }
  });

  const [form, setForm] = useState({
    chapterId: mcq?.chapterId ?? 0,
    question: mcq?.question ?? "",
    options: mcq?.options ?? ["", "", "", ""],
    correctOption: mcq?.correctOption ?? 0,
    explanation: mcq?.explanation ?? "",
    difficulty: mcq?.difficulty ?? "medium" as "easy" | "medium" | "hard",
  });
  const createMut = useCreateMcq();
  const updateMut = useUpdateMcq();

  const setOpt = (idx: number, val: string) =>
    setForm(f => { const o = [...f.options]; o[idx] = val; return { ...f, options: o }; });

  const handleSave = async () => {
    if (mcq) {
      await updateMut.mutateAsync({ id: mcq.id, data: { question: form.question, options: form.options, correctOption: form.correctOption, explanation: form.explanation, difficulty: form.difficulty } });
    } else {
      await createMut.mutateAsync({ data: { chapterId: form.chapterId, question: form.question, options: form.options, correctOption: form.correctOption, explanation: form.explanation, difficulty: form.difficulty } });
    }
    onSave();
    onClose();
  };

  const isPending = createMut.isPending || updateMut.isPending;
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl p-8 max-w-lg w-full my-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">{mcq ? "Edit MCQ" : "New MCQ"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <select value={subjectId} onChange={e => { setSubjectId(Number(e.target.value)); setForm(f => ({ ...f, chapterId: 0 })); }}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value={0}>Select subject</option>
                {(subjects ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chapter</label>
              <select value={form.chapterId} onChange={e => setForm(f => ({ ...f, chapterId: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" disabled={!subjectId}>
                <option value={0}>Select chapter</option>
                {(chapters ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <div className="flex gap-2">
              {(["easy", "medium", "hard"] as const).map(d => (
                <button key={d} onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                  className={cn("flex-1 py-2 rounded-lg text-xs font-medium capitalize border transition-colors",
                    form.difficulty === d ? {
                      easy: "border-green-500 bg-green-500/10 text-green-400",
                      medium: "border-yellow-500 bg-yellow-500/10 text-yellow-400",
                      hard: "border-red-500 bg-red-500/10 text-red-400",
                    }[d] : "border-border text-muted-foreground hover:border-primary/40"
                  )}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Question</label>
            <textarea value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} rows={3} placeholder="Enter the question..."
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Options <span className="text-muted-foreground font-normal">(click circle to mark correct)</span></label>
            <div className="space-y-2">
              {form.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button onClick={() => setForm(f => ({ ...f, correctOption: idx }))}
                    className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border-2 transition-colors",
                      form.correctOption === idx ? "bg-green-500 border-green-500 text-white" : "border-border text-muted-foreground hover:border-green-500/50"
                    )}>
                    {form.correctOption === idx ? <CheckCircle size={14} /> : optionLabels[idx]}
                  </button>
                  <input type="text" value={opt} onChange={e => setOpt(idx, e.target.value)} placeholder={`Option ${optionLabels[idx]}`}
                    className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Explanation <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} rows={2} placeholder="Explain the correct answer..."
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border hover:bg-secondary text-sm">Cancel</button>
          <button onClick={handleSave} disabled={!form.question || !form.chapterId || isPending}
            className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminMcqs() {
  const { data: subjects } = useGetSubjects();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const [selectedChapterId, setSelectedChapterId] = useState<number>(0);
  const { data: chapters } = useGetChapters(selectedSubjectId, {
    query: { queryKey: getGetChaptersQueryKey(selectedSubjectId), enabled: !!selectedSubjectId }
  });
  const { data, isLoading, refetch } = useGetMcqs(
    { subjectId: selectedSubjectId || undefined, chapterId: selectedChapterId || undefined },
    { query: { queryKey: getGetMcqsQueryKey({ subjectId: selectedSubjectId || undefined, chapterId: selectedChapterId || undefined }) } }
  );
  const deleteMut = useDeleteMcq();
  const [modal, setModal] = useState<{ open: boolean; mcq?: Mcq | null }>({ open: false });

  const mcqs = data?.mcqs ?? [];

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this MCQ?")) return;
    await deleteMut.mutateAsync({ id });
    refetch();
  };

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">MCQs</h1>
            <p className="text-muted-foreground text-sm">{mcqs.length} question{mcqs.length !== 1 ? "s" : ""} shown</p>
          </div>
          <button onClick={() => setModal({ open: true, mcq: null })}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">
            <Plus size={16} /> Add MCQ
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <select value={selectedSubjectId} onChange={e => { setSelectedSubjectId(Number(e.target.value)); setSelectedChapterId(0); }}
            className="px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value={0}>All Subjects</option>
            {(subjects ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {selectedSubjectId > 0 && (
            <select value={selectedChapterId} onChange={e => setSelectedChapterId(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value={0}>All Chapters</option>
              {(chapters ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />)}</div>
        ) : (
          <div className="space-y-3">
            {mcqs.map((mcq, i) => (
              <motion.div key={mcq.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-start gap-3">
                  <Zap size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-2">{mcq.question}</p>
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {mcq.options.map((opt, idx) => (
                        <p key={idx} className={`text-xs px-2 py-1 rounded ${idx === mcq.correctOption ? "text-green-400 bg-green-500/10" : "text-muted-foreground"}`}>
                          {optionLabels[idx]}. {opt}
                        </p>
                      ))}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${mcq.difficulty === "easy" ? "text-green-400 bg-green-500/10" : mcq.difficulty === "medium" ? "text-yellow-400 bg-yellow-500/10" : "text-red-400 bg-red-500/10"}`}>
                      {mcq.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setModal({ open: true, mcq })}
                      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(mcq.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {mcqs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Zap size={40} className="mx-auto mb-3 opacity-30" />
                <p>No MCQs found. Add one or change the filter.</p>
              </div>
            )}
          </div>
        )}
      </div>
      {modal.open && (
        <McqModal mcq={modal.mcq} onClose={() => setModal({ open: false })} onSave={refetch} />
      )}
    </Layout>
  );
}
