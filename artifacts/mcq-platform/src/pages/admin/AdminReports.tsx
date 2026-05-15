import { motion } from "framer-motion";
import { useAdminGetStats, useAdminGetSubjectReports } from "@workspace/api-client-react";
import type { SubjectReport } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { BarChart2, Users, Zap, BookOpen, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export default function AdminReports() {
  const { data: stats, isLoading: loadingStats } = useAdminGetStats();
  const { data: subjectReports, isLoading: loadingReports } = useAdminGetSubjectReports();
  const isLoading = loadingStats || loadingReports;

  const reports: SubjectReport[] = subjectReports ?? [];

  const barData = reports.map(s => ({
    name: s.subjectName,
    mcqs: s.totalMcqs,
    attempts: s.totalAttempts,
  }));

  const diffData = [
    { name: "Easy", value: 0, color: "#22c55e" },
    { name: "Medium", value: 0, color: "#eab308" },
    { name: "Hard", value: 0, color: "#ef4444" },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <BarChart2 size={22} className="text-primary" /> Reports & Analytics
          </h1>
          <p className="text-muted-foreground text-sm">Platform-wide performance insights</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[...Array(6)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-card border border-border animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total Students", value: stats?.totalStudents ?? 0, icon: Users, color: "text-blue-400" },
                { label: "Total MCQs", value: stats?.totalMcqs ?? 0, icon: Zap, color: "text-primary" },
                { label: "Total Exams", value: stats?.totalExams ?? 0, icon: Target, color: "text-green-400" },
                { label: "Total Subjects", value: stats?.totalSubjects ?? 0, icon: BookOpen, color: "text-yellow-400" },
                { label: "Premium Users", value: stats?.premiumUsers ?? 0, icon: Users, color: "text-orange-400" },
                { label: "Banned Users", value: stats?.bannedUsers ?? 0, icon: Users, color: "text-red-400" },
              ].map((m, i) => (
                <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="p-5 rounded-xl border border-border bg-card">
                  <m.icon size={16} className={`${m.color} mb-2`} />
                  <p className="text-2xl font-bold mb-0.5">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Subject bar chart */}
            {barData.length > 0 && (
              <div className="p-5 rounded-xl border border-border bg-card mb-6">
                <h2 className="font-semibold mb-4">MCQs & Attempts per Subject</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 10% 12%)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="mcqs" fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} name="MCQs" />
                    <Bar dataKey="attempts" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} name="Attempts" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Subject accuracy table */}
            {reports.length > 0 && (
              <div className="p-5 rounded-xl border border-border bg-card">
                <h2 className="font-semibold mb-4">Subject Performance</h2>
                <div className="space-y-3">
                  {reports.map((s: SubjectReport) => (
                    <div key={s.subjectId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{s.subjectName}</span>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{s.totalAttempts} attempts</span>
                          <span>{s.chapterCount} chapters</span>
                          <span className={`font-semibold ${s.avgAccuracy >= 70 ? "text-green-400" : s.avgAccuracy >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                            {Math.round(s.avgAccuracy)}% avg
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${s.avgAccuracy}%` }} transition={{ duration: 0.8 }}
                          className={`h-full rounded-full ${s.avgAccuracy >= 70 ? "bg-green-500" : s.avgAccuracy >= 50 ? "bg-yellow-500" : "bg-red-500"}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reports.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
                <p>No report data yet. Students need to take exams first.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
