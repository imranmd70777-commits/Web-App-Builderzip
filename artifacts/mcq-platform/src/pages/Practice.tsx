import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMcqs, useSubmitAnswer, useAddBookmark, useRemoveBookmark, getGetMcqsQueryKey } from "@workspace/api-client-react";
import type { Mcq, AnswerResult } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { Bookmark, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "all" | "bookmarked" | "wrong";

export default function Practice() {
  const { chapterId: chapterIdParam } = useParams<{ chapterId: string }>();
  const chapterId = parseInt(chapterIdParam ?? "0", 10);

  const [filter, setFilter] = useState<FilterType>("all");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const params = {
    chapterId,
    ...(filter === "bookmarked" ? { filter: "bookmarked" as const } : filter === "wrong" ? { filter: "wrong" as const } : {}),
  };

  const { data, isLoading, refetch } = useGetMcqs(params, {
    query: { queryKey: getGetMcqsQueryKey(params), enabled: !!chapterId }
  });

  const mcqs: Mcq[] = data?.mcqs ?? [];
  const currentMcq = mcqs[currentIdx];

  const submitMutation = useSubmitAnswer();
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();

  useEffect(() => {
    setCurrentIdx(0);
    setSelected(null);
    setSubmitted(false);
    setResult(null);
    setScore({ correct: 0, total: 0 });
  }, [filter]);

  const handleSubmit = async () => {
    if (selected === null || !currentMcq) return;
    try {
      const res = await submitMutation.mutateAsync({ id: currentMcq.id, data: { selectedOption: selected } });
      setResult(res);
      setSubmitted(true);
      setScore(s => ({ correct: s.correct + (res.isCorrect ? 1 : 0), total: s.total + 1 }));
    } catch {}
  };

  const handleNext = () => {
    setSelected(null);
    setSubmitted(false);
    setResult(null);
    setCurrentIdx(i => Math.min(i + 1, mcqs.length - 1));
  };

  const handlePrev = () => {
    setSelected(null);
    setSubmitted(false);
    setResult(null);
    setCurrentIdx(i => Math.max(i - 1, 0));
  };

  const toggleBookmark = async (mcq: Mcq) => {
    if (mcq.isBookmarked) {
      await removeBookmark.mutateAsync({ mcqId: mcq.id });
    } else {
      await addBookmark.mutateAsync({ mcqId: mcq.id });
    }
    refetch();
  };

  const optionLabels = ["A", "B", "C", "D"];

  if (isLoading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Practice Mode</h1>
            <p className="text-sm text-muted-foreground">{mcqs.length} questions</p>
          </div>
          {score.total > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm">
              <span className="text-green-400 font-semibold">{score.correct}</span>
              <span className="text-muted-foreground">/{score.total}</span>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(["all", "bookmarked", "wrong"] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === f ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "wrong" ? "Wrong Answers" : f === "bookmarked" ? "Bookmarked" : "All Questions"}
            </button>
          ))}
        </div>

        {mcqs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="mb-2">No questions found for this filter.</p>
            <button onClick={() => setFilter("all")} className="text-primary hover:underline text-sm">Show all questions</button>
          </div>
        ) : currentMcq ? (
          <>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-secondary mb-6 overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((currentIdx + 1) / mcqs.length) * 100}%` }} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={currentMcq.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <div className="p-6 rounded-xl border border-border bg-card mb-5">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">Q{currentIdx + 1} / {mcqs.length}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded capitalize", {
                          "bg-green-500/10 text-green-400": currentMcq.difficulty === "easy",
                          "bg-yellow-500/10 text-yellow-400": currentMcq.difficulty === "medium",
                          "bg-red-500/10 text-red-400": currentMcq.difficulty === "hard",
                        })}>{currentMcq.difficulty}</span>
                      </div>
                      <p className="text-base font-medium leading-relaxed">{currentMcq.question}</p>
                    </div>
                    <button
                      onClick={() => toggleBookmark(currentMcq)}
                      className={cn("flex-shrink-0 p-2 rounded-lg transition-colors", currentMcq.isBookmarked ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10")}
                    >
                      <Bookmark size={18} className={currentMcq.isBookmarked ? "fill-current" : ""} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {currentMcq.options.map((option, idx) => {
                      const isSelected = selected === idx;
                      const isCorrect = submitted && idx === result?.correctOption;
                      const isWrong = submitted && isSelected && !result?.isCorrect;
                      return (
                        <button
                          key={idx}
                          disabled={submitted}
                          onClick={() => !submitted && setSelected(idx)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-all duration-200",
                            !submitted && !isSelected && "border-border bg-background hover:border-primary/40 hover:bg-primary/5",
                            !submitted && isSelected && "border-primary bg-primary/10",
                            submitted && isCorrect && "border-green-500 bg-green-500/10 text-green-300",
                            submitted && isWrong && "border-destructive bg-destructive/10 text-red-300",
                            submitted && !isCorrect && !isWrong && "border-border bg-background opacity-50",
                          )}
                        >
                          <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                            !submitted && !isSelected && "bg-secondary text-muted-foreground",
                            !submitted && isSelected && "bg-primary text-white",
                            submitted && isCorrect && "bg-green-500 text-white",
                            submitted && isWrong && "bg-destructive text-white",
                            submitted && !isCorrect && !isWrong && "bg-secondary text-muted-foreground",
                          )}>
                            {submitted && isCorrect ? <CheckCircle size={14} /> : submitted && isWrong ? <XCircle size={14} /> : optionLabels[idx]}
                          </span>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {submitted && result && result.explanation && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={cn("p-5 rounded-xl border mb-5", result.isCorrect ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5")}>
                    <div className="flex items-center gap-2 mb-2">
                      {result.isCorrect ? <CheckCircle size={16} className="text-green-400" /> : <XCircle size={16} className="text-red-400" />}
                      <span className={cn("text-sm font-semibold", result.isCorrect ? "text-green-400" : "text-red-400")}>
                        {result.isCorrect ? "Correct!" : "Incorrect"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
                  </motion.div>
                )}

                <div className="flex items-center justify-between">
                  <button onClick={handlePrev} disabled={currentIdx === 0}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary disabled:opacity-30">
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <div className="flex gap-3">
                    {!submitted ? (
                      <button onClick={handleSubmit} disabled={selected === null || submitMutation.isPending}
                        className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
                        {submitMutation.isPending ? "Submitting..." : "Submit Answer"}
                      </button>
                    ) : (
                      <button onClick={handleNext} disabled={currentIdx === mcqs.length - 1}
                        className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
                        Next <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
