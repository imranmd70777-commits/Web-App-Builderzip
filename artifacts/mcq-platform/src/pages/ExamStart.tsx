import { useState } from "react";
import { useSearch, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetSubjects, useGetChapters, useStartExam } from "@workspace/api-client-react";
import { getGetChaptersQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { Clock, Zap, BookOpen, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExamStart() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preChapterId = params.get("chapterId");
  const preSubjectId = params.get("subjectId");
  const preType = params.get("type");
  const [, setLocation] = useLocation();

  const [examType, setExamType] = useState<"practice" | "timed" | "full">(
    (preType as any) ?? "timed"
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(preSubjectId ? parseInt(preSubjectId) : null);
  const [selectedChapterIds, setSelectedChapterIds] = useState<number[]>(preChapterId ? [parseInt(preChapterId)] : []);
  const [questionCount, setQuestionCount] = useState(20);
  const [duration, setDuration] = useState(30);

  const { data: subjects } = useGetSubjects();
  const { data: chapters } = useGetChapters(selectedSubjectId!, {
    query: { queryKey: getGetChaptersQueryKey(selectedSubjectId!), enabled: !!selectedSubjectId }
  });

  const startExam = useStartExam();

  const toggleChapter = (id: number) => {
    setSelectedChapterIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleStart = async () => {
    try {
      const res = await startExam.mutateAsync({
        data: {
          type: examType,
          subjectId: selectedSubjectId ?? undefined,
          chapterIds: selectedChapterIds.length > 0 ? selectedChapterIds : undefined,
          questionCount,
          timeLimitMinutes: examType === "timed" ? duration : undefined,
        }
      });
      setLocation(`/exam/session/${res.id}`);
    } catch (err) {
      console.error("Failed to start exam", err);
    }
  };

  const examTypes = [
    { id: "practice", label: "Practice", desc: "No timer, instant feedback", icon: BookOpen },
    { id: "timed", label: "Timed Quiz", desc: "Timer pressure, review after", icon: Clock },
    { id: "full", label: "Full Exam", desc: "Simulate real exam conditions", icon: Zap },
  ] as const;

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Start an Exam</h1>
          <p className="text-muted-foreground text-sm">Configure your exam session</p>
        </div>

        {/* Exam type */}
        <div className="mb-6">
          <h2 className="font-semibold mb-3 text-sm">Exam Type</h2>
          <div className="grid grid-cols-3 gap-3">
            {examTypes.map(t => (
              <button
                key={t.id}
                onClick={() => setExamType(t.id)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all",
                  examType === t.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                )}
              >
                <t.icon size={18} className={examType === t.id ? "text-primary mb-2" : "text-muted-foreground mb-2"} />
                <p className={cn("text-sm font-medium", examType === t.id ? "text-primary" : "")}>{t.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Subject selection */}
        <div className="mb-6">
          <h2 className="font-semibold mb-3 text-sm">Subject <span className="text-muted-foreground font-normal">(optional)</span></h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedSubjectId(null); setSelectedChapterIds([]); }}
              className={cn("px-3 py-1.5 rounded-lg text-sm border transition-colors",
                !selectedSubjectId ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              All Subjects
            </button>
            {(subjects ?? []).map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedSubjectId(s.id); setSelectedChapterIds([]); }}
                className={cn("px-3 py-1.5 rounded-lg text-sm border transition-colors",
                  selectedSubjectId === s.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Chapter selection */}
        {selectedSubjectId && chapters && chapters.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Chapters <span className="text-muted-foreground font-normal">(optional)</span></h2>
              <button onClick={() => setSelectedChapterIds(chapters.map(c => c.id))} className="text-xs text-primary hover:underline">
                Select all
              </button>
            </div>
            <div className="space-y-2">
              {chapters.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => toggleChapter(ch.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-colors",
                    selectedChapterIds.includes(ch.id) ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                    selectedChapterIds.includes(ch.id) ? "bg-primary border-primary" : "border-border"
                  )}>
                    {selectedChapterIds.includes(ch.id) && <CheckSquare size={10} className="text-white" />}
                  </div>
                  <div>
                    <p className="font-medium">{ch.name}</p>
                    <p className="text-xs text-muted-foreground">{ch.mcqCount} questions</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="mb-8 p-5 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-4 text-sm">Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Number of questions: <span className="text-foreground font-semibold">{questionCount}</span>
              </label>
              <input type="range" min={5} max={50} step={5} value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>5</span><span>50</span></div>
            </div>
            {examType === "timed" && (
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Duration: <span className="text-foreground font-semibold">{duration} minutes</span>
                </label>
                <input type="range" min={5} max={120} step={5} value={duration}
                  onChange={e => setDuration(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>5 min</span><span>120 min</span></div>
              </div>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleStart}
          disabled={startExam.isPending}
          className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Zap size={18} />
          {startExam.isPending ? "Starting..." : "Start Exam"}
        </motion.button>
      </div>
    </Layout>
  );
}
