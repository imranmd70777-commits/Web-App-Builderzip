import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { useGetSubject, useGetChapters, getGetSubjectQueryKey, getGetChaptersQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { BookOpen, Zap, Clock, RotateCcw, Bookmark } from "lucide-react";

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const subjectId = parseInt(id, 10);
  const { data: subject, isLoading: loadingSubject } = useGetSubject(subjectId, {
    query: { queryKey: getGetSubjectQueryKey(subjectId), enabled: !!subjectId }
  });
  const { data: chapters, isLoading: loadingChapters } = useGetChapters(subjectId, {
    query: { queryKey: getGetChaptersQueryKey(subjectId), enabled: !!subjectId }
  });

  const isLoading = loadingSubject || loadingChapters;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-2">
          <Link href="/subjects">
            <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">Subjects</span>
          </Link>
          <span className="text-muted-foreground mx-2">/</span>
          <span className="text-sm">{subject?.name ?? "Loading..."}</span>
        </div>

        {isLoading ? (
          <div className="animate-pulse mt-4">
            <div className="h-8 bg-card rounded w-48 mb-4" />
            <div className="h-4 bg-card rounded w-72 mb-8" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-card border border-border" />)}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4 mb-8 mt-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: (subject?.color ?? "#6366f1") + "20", border: `1px solid ${(subject?.color ?? "#6366f1")}30` }}>
                <BookOpen size={24} style={{ color: subject?.color ?? "#6366f1" }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{subject?.name}</h1>
                <p className="text-muted-foreground text-sm mt-1">{subject?.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{subject?.chapterCount} chapters</span>
                  <span>•</span>
                  <span>{subject?.mcqCount} total MCQs</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Chapters</h2>
              <Link href={`/exam/start?subjectId=${subjectId}`}>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                  <Zap size={14} />
                  Full Subject Exam
                </button>
              </Link>
            </div>

            <div className="space-y-3">
              {(chapters ?? []).map((chapter, i) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                >
                  <div className="mb-3">
                    <h3 className="font-semibold">{chapter.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{chapter.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{chapter.mcqCount} questions</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/practice/${chapter.id}`}>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                        <BookOpen size={12} /> Practice MCQs
                      </button>
                    </Link>
                    <Link href={`/exam/start?chapterId=${chapter.id}&type=timed`}>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary text-foreground border border-border hover:bg-secondary/80 transition-colors">
                        <Clock size={12} /> Timed Quiz
                      </button>
                    </Link>
                    <Link href={`/exam/start?chapterId=${chapter.id}&type=full`}>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary text-foreground border border-border hover:bg-secondary/80 transition-colors">
                        <Zap size={12} /> Full Exam
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
            {chapters?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                <p>No chapters yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
