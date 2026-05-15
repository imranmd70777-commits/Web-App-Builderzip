import { motion } from "framer-motion";
import { useGetDashboardStats, useGetSubjects } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { BarChart2, Target, Flame, Star, TrendingUp, BookOpen } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

export default function Progress() {
  const { data: stats, isLoading } = useGetDashboardStats();

  const radarData = stats?.subjectProgress?.map(sp => ({
    subject: sp.subjectName,
    accuracy: sp.accuracy,
    attempted: Math.min(100, (sp.attempted / Math.max(sp.total, 1)) * 100),
  })) ?? [];

  const barData = stats?.weakChapters?.map(ch => ({
    name: ch.chapterName.length > 12 ? ch.chapterName.slice(0, 12) + "…" : ch.chapterName,
    accuracy: Math.round(ch.accuracy),
  })) ?? [];

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Progress</h1>
          <p className="text-muted-foreground text-sm">Your learning analytics and performance insights</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-card border border-border animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Target, label: "MCQs Attempted", value: stats?.totalMcqsAttempted ?? 0, color: "text-blue-400", bg: "bg-blue-500/10" },
                { icon: BarChart2, label: "Overall Accuracy", value: `${stats?.accuracy ?? 0}%`, color: "text-primary", bg: "bg-primary/10" },
                { icon: Flame, label: "Day Streak", value: `${stats?.streakDays ?? 0}d`, color: "text-orange-400", bg: "bg-orange-500/10" },
                { icon: Star, label: "Total Points", value: stats?.totalPoints ?? 0, color: "text-yellow-400", bg: "bg-yellow-500/10" },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-xl border border-border bg-card">
                  <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                    <s.icon size={16} className={s.color} />
                  </div>
                  <div className="text-2xl font-bold mb-0.5">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Radar chart */}
              <div className="p-5 rounded-xl border border-border bg-card">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" />
                  Subject Coverage
                </h2>
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(240 10% 18%)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} />
                      <Radar name="Accuracy" dataKey="accuracy" stroke="hsl(262 83% 58%)" fill="hsl(262 83% 58%)" fillOpacity={0.15} />
                      <Radar name="Coverage" dataKey="attempted" stroke="hsl(142 76% 36%)" fill="hsl(142 76% 36%)" fillOpacity={0.1} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                    Practice MCQs to see subject coverage.
                  </div>
                )}
              </div>

              {/* Weak chapters bar */}
              <div className="p-5 rounded-xl border border-border bg-card">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-yellow-400" />
                  Chapter Accuracy
                </h2>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }} width={80} />
                      <Tooltip
                        contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 10% 12%)", borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => [`${v}%`, "Accuracy"]}
                      />
                      <Bar dataKey="accuracy" radius={4}>
                        {barData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.accuracy >= 70 ? "hsl(142 76% 36%)" : entry.accuracy >= 50 ? "hsl(38 92% 50%)" : "hsl(0 84% 60%)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                    No data yet.
                  </div>
                )}
              </div>
            </div>

            {/* Subject performance table */}
            {stats?.subjectProgress && stats.subjectProgress.length > 0 && (
              <div className="p-5 rounded-xl border border-border bg-card">
                <h2 className="font-semibold mb-4">Subject Breakdown</h2>
                <div className="space-y-4">
                  {stats.subjectProgress.map(sp => {
                    const color = sp.accuracy >= 70 ? "bg-green-500" : sp.accuracy >= 50 ? "bg-yellow-500" : "bg-red-500";
                    return (
                      <div key={sp.subjectId}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{sp.subjectName}</span>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{sp.attempted}/{sp.total} attempted</span>
                            <span className={`font-semibold ${sp.accuracy >= 70 ? "text-green-400" : sp.accuracy >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                              {sp.accuracy}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${sp.accuracy}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${color}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
