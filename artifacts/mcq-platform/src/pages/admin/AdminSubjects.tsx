import { useState } from "react";
import { motion } from "framer-motion";
import { useGetSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from "@workspace/api-client-react";
import type { Subject } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { Plus, Pencil, Trash2, BookOpen, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#06b6d4"];

interface FormState {
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
}

function SubjectModal({ subject, onClose, onSave }: { subject?: Subject | null; onClose: () => void; onSave: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>({
    name: subject?.name ?? "",
    description: subject?.description ?? "",
    color: subject?.color ?? COLORS[0],
    icon: subject?.icon ?? "BookOpen",
    isActive: subject?.isActive ?? true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const createMut = useCreateSubject();
  const updateMut = useUpdateSubject();

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    if (errors[key as keyof FormErrors]) setErrors(err => ({ ...err, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = "Subject name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      if (subject) {
        await updateMut.mutateAsync({ id: subject.id, data: form });
        toast({ title: "Subject updated", description: `"${form.name}" has been updated successfully.` });
      } else {
        await createMut.mutateAsync({ data: form });
        toast({ title: "Subject created", description: `"${form.name}" has been added successfully.` });
      }
      onSave();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Failed to save subject", description: message, variant: "destructive" });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">{subject ? "Edit Subject" : "New Subject"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. Physics"
              className={cn(
                "w-full px-4 py-2.5 rounded-lg bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                errors.name ? "border-red-500" : "border-border"
              )}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={set("description") as React.ChangeEventHandler<HTMLTextAreaElement>}
              placeholder="A brief description of this subject..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={cn("w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center", form.color === c ? "border-white scale-110" : "border-transparent")}
                  style={{ background: c }}>
                  {form.color === c && <CheckCircle2 size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">{form.isActive ? "Visible to students" : "Hidden from students"}</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                form.isActive ? "bg-primary" : "bg-secondary border border-border"
              )}
            >
              <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                form.isActive ? "translate-x-6" : "translate-x-1")} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border hover:bg-secondary text-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isPending}
            className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {isPending ? "Saving..." : subject ? "Update Subject" : "Create Subject"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminSubjects() {
  const { data: subjects, isLoading, refetch } = useGetSubjects();
  const deleteMut = useDeleteSubject();
  const { toast } = useToast();
  const [modal, setModal] = useState<{ open: boolean; subject?: Subject | null }>({ open: false });

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This will also delete all chapters and MCQs within it.`)) return;
    try {
      await deleteMut.mutateAsync({ id });
      toast({ title: "Subject deleted", description: `"${name}" has been removed.` });
      refetch();
    } catch {
      toast({ title: "Failed to delete subject", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Subjects</h1>
            <p className="text-muted-foreground text-sm">Manage all learning subjects</p>
          </div>
          <button onClick={() => setModal({ open: true, subject: null })}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">
            <Plus size={16} /> Add Subject
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />)}</div>
        ) : (
          <div className="space-y-3">
            {(subjects ?? []).map((subject, i) => (
              <motion.div key={subject.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={cn("flex items-center gap-4 p-4 rounded-xl border bg-card", subject.isActive ? "border-border" : "border-border opacity-60")}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: subject.color + "20", border: `1px solid ${subject.color}30` }}>
                  <BookOpen size={18} style={{ color: subject.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{subject.name}</p>
                    {!subject.isActive && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">Hidden</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{subject.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{subject.chapterCount} chapters • {subject.mcqCount} MCQs</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setModal({ open: true, subject })}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(subject.id, subject.name)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
            {subjects?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                <p>No subjects yet. Add one to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {modal.open && (
        <SubjectModal subject={modal.subject} onClose={() => setModal({ open: false })} onSave={refetch} />
      )}
    </Layout>
  );
}
