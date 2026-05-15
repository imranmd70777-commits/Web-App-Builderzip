import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { useGetResult, getGetResultQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { CheckCircle, XCircle, Clock, Target, RotateCcw, Home, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - Math.min(score, 100) / 100);
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} stroke="hsl(240 10% 12%)" strokeWidth="12" fill="none" />
        <motion.circle
          cx="64" cy="64" r={radius}
          stroke={color} strokeWidth="12" fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{Math.round(score)}%</span>
        <span className="text-xs text-muted-foreground">Score</span>
      </div>
    </div>
  );
}

export default function ExamResult() {
  const { resultId } = useParams<{ resultId: string }>();
  const id = parseInt(resultId ?? "0", 10);
  const { data: result, isLoading } = useGetResult(id, {
    query: { queryKey: getGetResultQueryKey(id), enabled: !!id }
  });

  if (isLoading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    </Layout>
  );

  if (!result) return (
    <Layout>
      <div className="flex items-center justify-center h-64 text-muted-foreground">Result not found.</div>
    </Layout>
  );

  const percentage = Math.round((result.score / Math.max(result.total, 1)) * 100);
  const wrong = result.total - result.score;
  const passed = percentage >= 50;

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Score card */}
          <div className="p-8 rounded-2xl border border-border bg-card text-center mb-8">
            <h1 className="text-xl font-bold mb-1">Exam Complete!</h1>
            <p className="text-muted-foreground text-sm mb-6">Here's how you did</p>

            <div className="flex justify-center mb-8">
              <ScoreRing score={percentage} />
            </div>

            <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8",
              passed ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
            )}>
              {passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {passed ? "Passed!" : "Needs improvement"}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-background border border-border">
                <p className="text-xl font-bold text-green-400">{result.score}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border">
                <p className="text-xl font-bold text-red-400">{wrong}</p>
                <p className="text-xs text-muted-foreground">Wrong</p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border">
                <p className="text-xl font-bold">{result.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border">
                <p className="text-xl font-bold text-primary">{Math.round(result.accuracy * 10) / 10}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
            </div>

            {result.timeTakenSeconds !== undefined && (
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock size={12} /> Time taken: {Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary text-sm font-medium">
                <Home size={16} /> Dashboard
              </button>
            </Link>
            <Link href="/exam/start">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90">
                <RotateCcw size={16} /> New Exam
              </button>
            </Link>
            <Link href="/results">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary text-sm font-medium">
                <Target size={16} /> All Results
              </button>
            </Link>
          </div>

          {/* Chapter breakdown */}
          {result.chapterBreakdown && result.chapterBreakdown.length > 0 && (
            <div className="p-5 rounded-xl border border-border bg-card">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-primary" /> Chapter Breakdown
              </h2>
              <div className="space-y-4">
                {result.chapterBreakdown.map(ch => {
                  const chPct = Math.round((ch.correct / Math.max(ch.total, 1)) * 100);
                  return (
                    <div key={ch.chapterId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{ch.chapterName}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{ch.correct}/{ch.total} correct</span>
                          <span className={cn("font-semibold",
                            chPct >= 70 ? "text-green-400" : chPct >= 50 ? "text-yellow-400" : "text-red-400"
                          )}>{chPct}%</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${chPct}%` }}
                          transition={{ duration: 0.8 }}
                          className={cn("h-full rounded-full", chPct >= 70 ? "bg-green-500" : chPct >= 50 ? "bg-yellow-500" : "bg-red-500")}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
