import { useState } from "react";
import { motion } from "framer-motion";
import { useGetSubjects, useGetChapters, useCreateChapter, useUpdateChapter, useDeleteChapter } from "@workspace/api-client-react";
import { getGetChaptersQueryKey } from "@workspace/api-client-react";
import type { Chapter } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { Plus, Pencil, Trash2, BookOpen, X } from "lucide-react";

function ChapterModal({ chapter, subjectId: defaultSubjectId, onClose, onSave }: {
  chapter?: Chapter | null; subjectId?: number; onClose: () => void; onSave: () => void;
}) {
  const { data: subjects } = useGetSubjects();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(chapter?.subjectId ?? defaultSubjectId ?? 0);
  const [form, setForm] = useState({
    name: chapter?.name ?? "",
    description: chapter?.description ?? "",
    order: chapter?.order ?? 1,
  });
  const createMut = useCreateChapter();
  const updateMut = useUpdateChapter();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: key === "order" ? Number(e.target.value) : e.target.value }));

  const handleSave = async () => {
    if (chapter) {
      await updateMut.mutateAsync({ id: chapter.id, data: form });
    } else {
      await createMut.mutateAsync({ subjectId: selectedSubjectId, data: form });
    }
    onSave();
    onClose();
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">{chapter ? "Edit Chapter" : "New Chapter"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          {!chapter && (
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value={0}>Select subject</option>
                {(subjects ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Chapter Name</label>
            <input type="text" value={form.name} onChange={set("name")} placeholder="e.g. Mechanics"
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea value={form.description} onChange={set("description") as any} rows={3} placeholder="Brief description..."
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Display Order</label>
            <input type="number" value={form.order} onChange={set("order")} min={1}
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border hover:bg-secondary text-sm">Cancel</button>
          <button onClick={handleSave} disabled={!form.name || (!chapter && !selectedSubjectId) || isPending}
            className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminChapters() {
  const { data: subjects } = useGetSubjects();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const { data: chapters, isLoading, refetch } = useGetChapters(selectedSubjectId, {
    query: { queryKey: getGetChaptersQueryKey(selectedSubjectId), enabled: !!selectedSubjectId }
  });
  const deleteMut = useDeleteChapter();
  const [modal, setModal] = useState<{ open: boolean; chapter?: Chapter | null }>({ open: false });

  const displayChapters = selectedSubjectId ? (chapters ?? []) : [];

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this chapter? All MCQs in it will also be deleted.")) return;
    await deleteMut.mutateAsync({ id });
    refetch();
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Chapters</h1>
            <p className="text-muted-foreground text-sm">Manage chapters within subjects</p>
          </div>
          <button onClick={() => setModal({ open: true, chapter: null })}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">
            <Plus size={16} /> Add Chapter
          </button>
        </div>

        <div className="mb-6">
          <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(Number(e.target.value))}
            className="px-3 py-2.5 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value={0}>Select a subject to view chapters</option>
            {(subjects ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {!selectedSubjectId ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p>Select a subject above to view and manage chapters.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />)}</div>
        ) : (
          <div className="space-y-3">
            {displayChapters.map((chapter, i) => (
              <motion.div key={chapter.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {chapter.order}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{chapter.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{chapter.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{chapter.mcqCount} MCQs</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setModal({ open: true, chapter })}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(chapter.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
            {displayChapters.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                <p>No chapters in this subject.</p>
              </div>
            )}
          </div>
        )}
      </div>
      {modal.open && (
        <ChapterModal chapter={modal.chapter} subjectId={selectedSubjectId || undefined}
          onClose={() => setModal({ open: false })} onSave={refetch} />
      )}
    </Layout>
  );
}
