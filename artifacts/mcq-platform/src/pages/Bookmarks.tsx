import { useState } from "react";
import { motion } from "framer-motion";
import { useGetBookmarks, useRemoveBookmark } from "@workspace/api-client-react";
import type { Mcq } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { Bookmark, BookmarkX, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Bookmarks() {
  const { data, isLoading, refetch } = useGetBookmarks();
  const removeBookmark = useRemoveBookmark();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const bookmarks: Mcq[] = data ?? [];

  const toggle = (id: number) => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const handleRemove = async (mcqId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeBookmark.mutateAsync({ mcqId });
    refetch();
  };

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Bookmark size={22} className="text-primary" /> Bookmarks
          </h1>
          <p className="text-muted-foreground text-sm">{bookmarks.length} saved question{bookmarks.length !== 1 ? "s" : ""}</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />)}</div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bookmark size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">No bookmarks yet</p>
            <p className="text-sm">Bookmark questions during practice to review them here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((mcq, i) => (
              <motion.div key={mcq.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card overflow-hidden">
                <button onClick={() => toggle(mcq.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors">
                  <Bookmark size={16} className="text-primary flex-shrink-0 fill-current" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mcq.question}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded capitalize", {
                        "bg-green-500/10 text-green-400": mcq.difficulty === "easy",
                        "bg-yellow-500/10 text-yellow-400": mcq.difficulty === "medium",
                        "bg-red-500/10 text-red-400": mcq.difficulty === "hard",
                      })}>{mcq.difficulty}</span>
                      {mcq.tags && mcq.tags.length > 0 && <span className="text-xs text-muted-foreground">{mcq.tags[0]}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={e => handleRemove(mcq.id, e)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-red-400 text-muted-foreground transition-colors">
                      <BookmarkX size={16} />
                    </button>
                    {expanded.has(mcq.id) ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>
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
