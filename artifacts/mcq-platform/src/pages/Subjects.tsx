import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetSubjects } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { BookOpen, ChevronRight, Search } from "lucide-react";
import { useState } from "react";

export default function Subjects() {
  const { data: subjects, isLoading } = useGetSubjects();
  const [search, setSearch] = useState("");
  const filtered = (subjects ?? []).filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Subjects</h1>
          <p className="text-muted-foreground text-sm">Choose a subject to browse chapters and start practicing</p>
        </div>
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search subjects..."
            className="w-full max-w-sm pl-9 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground"
          />
        </div>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-xl bg-card border border-border animate-pulse" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((subject, i) => (
              <motion.div key={subject.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Link href={`/subjects/${subject.id}`}>
                  <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: subject.color + "20", border: `1px solid ${subject.color}30` }}>
                        <BookOpen size={22} style={{ color: subject.color }} />
                      </div>
                      <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{subject.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{subject.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><BookOpen size={12} />{subject.chapterCount} chapters</span>
                      <span>{subject.mcqCount} MCQs</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p>No subjects found.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
