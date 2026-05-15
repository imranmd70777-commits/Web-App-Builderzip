import { useState } from "react";
import { motion } from "framer-motion";
import { useGetWrongAnswers } from "@workspace/api-client-react";
import type { Mcq } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { XCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WrongAnswers() {
  const { data, isLoading } = useGetWrongAnswers();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const wrongs: Mcq[] = Array.isArray(data) ? data.filter(m => m.isWrong) : [];

  const toggle = (id: number) => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <XCircle size={22} className="text-red-400" /> Wrong Answers
          </h1>
          <p className="text-muted-foreground text-sm">{wrongs.length} question{wrongs.length !== 1 ? "s" : ""} to review</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />)}</div>
        ) : wrongs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CheckCircle size={40} className="mx-auto mb-3 opacity-30 text-green-400" />
            <p className="font-medium mb-1">Perfect record!</p>
            <p className="text-sm">You haven't made any mistakes yet, or you've corrected all of them.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wrongs.map((mcq, i) => (
              <motion.div key={mcq.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-destructive/20 bg-card overflow-hidden">
                <button onClick={() => toggle(mcq.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors">
                  <XCircle size={16} className="text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mcq.question}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded capitalize", {
                        "bg-green-500/10 text-green-400": mcq.difficulty === "easy",
                        "bg-yellow-500/10 text-yellow-400": mcq.difficulty === "medium",
                        "bg-red-500/10 text-red-400": mcq.difficulty === "hard",
                      })}>{mcq.difficulty}</span>
                    </div>
                  </div>
                  {expanded.has(mcq.id) ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />}
                </button>
                {expanded.has(mcq.id) && (
                  <div className="px-4 pb-4 border-t border-border/50">
                    <p className="text-sm font-medium mt-3 mb-3">{mcq.question}</p>
                    <div className="space-y-2">
                      {mcq.options.map((opt, idx) => (
                        <div key={idx} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                          idx === mcq.correctOption ? "bg-green-500/10 text-green-300" : "text-muted-foreground"
                        )}>
                          {idx === mcq.correctOption ? <CheckCircle size={14} className="text-green-400" /> : <span className="w-3.5" />}
                          {opt}
                          {idx === mcq.correctOption && <span className="ml-auto text-xs text-green-400">Correct answer</span>}
                        </div>
                      ))}
                    </div>
                    {mcq.explanation && (
                      <p className="mt-3 text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg leading-relaxed">{mcq.explanation}</p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
