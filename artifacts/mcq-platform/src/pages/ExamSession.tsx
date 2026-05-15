import { useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetExam, useSubmitExam } from "@workspace/api-client-react";
import { getGetExamQueryKey } from "@workspace/api-client-react";
import { Clock, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function Timer({ minutes, onExpire }: { minutes: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(minutes * 60);

  useState(() => {
    if (remaining <= 0) { onExpire(); return; }
    const t = setInterval(() => setRemaining(r => { if (r <= 1) { onExpire(); clearInterval(t); return 0; } return r - 1; }), 1000);
    return () => clearInterval(t);
  });

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const urgent = remaining < 120;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono font-semibold",
      urgent ? "border-destructive/50 bg-destructive/10 text-red-400 animate-pulse" : "border-border bg-card"
    )}>
      <Clock size={14} />
      {mins}:{secs.toString().padStart(2, "0")}
    </div>
  );
}

export default function ExamSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  const examId = parseInt(sessionId ?? "0", 10);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: session, isLoading } = useGetExam(examId, {
    query: { queryKey: getGetExamQueryKey(examId), enabled: !!examId }
  });
  const submitExam = useSubmitExam();

  const mcqs = session?.mcqs ?? [];
  const current = mcqs[currentIdx];

  const handleSelect = (optionIdx: number) => {
    if (!current) return;
    setAnswers(prev => ({ ...prev, [current.id]: optionIdx }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answersArray = Object.entries(answers).map(([mcqId, selectedOption]) => ({
        mcqId: parseInt(mcqId, 10),
        selectedOption,
      }));
      const res = await submitExam.mutateAsync({
        id: examId,
        data: { answers: answersArray }
      });
      setLocation(`/results/${res.id}`);
    } catch {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = mcqs.length - answeredCount;
  const optionLabels = ["A", "B", "C", "D"];

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!session) return (
    <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground">
      Session not found.
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm font-medium capitalize">{session.type} Exam</p>
            <p className="text-xs text-muted-foreground">{answeredCount}/{mcqs.length} answered</p>
          </div>
          <div className="flex items-center gap-3">
            {session.timeLimitMinutes && (
              <Timer minutes={session.timeLimitMinutes} onExpire={handleSubmit} />
            )}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        {/* Question navigator */}
        <div className="flex flex-wrap gap-2 mb-8">
          {mcqs.map((mcq, idx) => (
            <button
              key={mcq.id}
              onClick={() => setCurrentIdx(idx)}
              className={cn(
                "w-9 h-9 rounded-lg text-xs font-bold border transition-colors",
                idx === currentIdx && "border-primary bg-primary text-white",
                idx !== currentIdx && answers[mcq.id] !== undefined && "border-green-500/50 bg-green-500/10 text-green-400",
                idx !== currentIdx && answers[mcq.id] === undefined && "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {current && (
          <AnimatePresence mode="wait">
            <motion.div key={current.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
              <div className="p-6 rounded-xl border border-border bg-card mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">Q{currentIdx + 1}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded capitalize", {
                    "bg-green-500/10 text-green-400": current.difficulty === "easy",
                    "bg-yellow-500/10 text-yellow-400": current.difficulty === "medium",
                    "bg-red-500/10 text-red-400": current.difficulty === "hard",
                  })}>{current.difficulty}</span>
                </div>
                <p className="text-base font-medium leading-relaxed mb-6">{current.question}</p>
                <div className="space-y-3">
                  {current.options.map((option, idx) => {
                    const isSelected = answers[current.id] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-all",
                          isSelected ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                        )}
                      >
                        <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                          isSelected ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                        )}>
                          {optionLabels[idx]}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setCurrentIdx(i => Math.max(i - 1, 0))} disabled={currentIdx === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary disabled:opacity-30">
                  <ChevronLeft size={16} /> Previous
                </button>
                <button onClick={() => setCurrentIdx(i => Math.min(i + 1, mcqs.length - 1))} disabled={currentIdx === mcqs.length - 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary disabled:opacity-30">
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-yellow-400" />
              <h2 className="text-lg font-bold">Submit Exam?</h2>
            </div>
            {unansweredCount > 0 && (
              <p className="text-muted-foreground text-sm mb-2">
                You have <span className="text-yellow-400 font-semibold">{unansweredCount} unanswered</span> question{unansweredCount !== 1 ? "s" : ""}.
              </p>
            )}
            <p className="text-muted-foreground text-sm mb-6">Once submitted, you cannot change your answers.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-lg border border-border hover:bg-secondary text-sm">Go back</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
