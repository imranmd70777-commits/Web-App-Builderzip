import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetResults } from "@workspace/api-client-react";
import type { ExamResult } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { BarChart2, Clock, CheckCircle, XCircle, ChevronRight, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Results() {
  const { data: results, isLoading } = useGetResults();
  const list: ExamResult[] = results ?? [];

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">My Results</h1>
            <p className="text-muted-foreground text-sm">Your exam history</p>
          </div>
          <Link href="/exam/start">
            <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
              New Exam
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-2">No exams taken yet</p>
            <p className="text-sm mb-6">Take your first exam to see results here</p>
            <Link href="/exam/start">
              <button className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">
                Take an Exam
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((r, i) => {
              const pct = Math.round((r.score / Math.max(r.total, 1)) * 100);
              const passed = pct >= 50;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={`/results/${r.id}`}>
                    <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2",
                          passed ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"
                        )}>
                          <span className={cn("text-sm font-bold", passed ? "text-green-400" : "text-red-400")}>{pct}%</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {passed ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
                            <span className="text-sm font-medium">{r.score}/{r.total} correct</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{Math.round(r.accuracy * 10) / 10}% accuracy</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock size={11} />{formatDate(r.createdAt)}</span>
                            <span>{Math.floor(r.timeTakenSeconds / 60)}m {r.timeTakenSeconds % 60}s</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
