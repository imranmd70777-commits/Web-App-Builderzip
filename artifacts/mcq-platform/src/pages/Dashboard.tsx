import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetDashboardStats, useGetSubjects } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { BarChart2, Flame, Star, Target, BookOpen, ChevronRight, TrendingUp, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl border border-border bg-card"
    >
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="text-2xl font-bold mb-0.5">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {sub && <div className="text-xs text-primary mt-1">{sub}</div>}
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: subjects } = useGetSubjects();

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's your study summary</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Target} label="Total Attempted" value={stats?.totalMcqsAttempted ?? 0} color="bg-blue-500" />
          <StatCard icon={BarChart2} label="Accuracy" value={`${stats?.accuracy ?? 0}%`} color="bg-primary" />
          <StatCard icon={Flame} label="Day Streak" value={`${stats?.streakDays ?? 0} days`} color="bg-orange-500" />
          <StatCard icon={Star} label="Total Points" value={stats?.totalPoints ?? 0} color="bg-yellow-500" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Activity chart */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-border bg-card">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              7-Day Activity
            </h2>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={stats.recentActivity}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 10% 12%)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(0 0% 98%)" }}
                  />
                  <Line type="monotone" dataKey="mcqsAttempted" stroke="hsl(262 83% 58%)" strokeWidth={2} dot={false} name="Attempted" />
                  <Line type="monotone" dataKey="correctAnswers" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={false} name="Correct" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                No activity yet. Start practicing to see your progress.
              </div>
            )}
          </div>

          {/* Weak chapters */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500" />
              Focus Areas
            </h2>
            {stats?.weakChapters && stats.weakChapters.length > 0 ? (
              <div className="space-y-3">
                {stats.weakChapters.map(ch => (
                  <div key={ch.chapterId} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{ch.chapterName}</p>
                      <p className="text-xs text-muted-foreground">{ch.subjectName}</p>
                    </div>
                    <span className="text-xs font-medium text-yellow-500 ml-2">{Math.round(ch.accuracy)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Practice some MCQs first to see which chapters need attention.</p>
            )}
          </div>
        </div>

        {/* Subjects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Subjects</h2>
            <Link href="/subjects">
              <span className="text-sm text-primary hover:underline cursor-pointer flex items-center gap-1">
                View all <ChevronRight size={14} />
              </span>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(subjects ?? []).slice(0, 4).map((subject, i) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link href={`/subjects/${subject.id}`}>
                  <div className="p-5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: subject.color + "20", border: `1px solid ${subject.color}30` }}>
                      <BookOpen size={18} style={{ color: subject.color }} />
                    </div>
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{subject.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{subject.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{subject.chapterCount} chapters</span>
                      <span>•</span>
                      <span>{subject.mcqCount} MCQs</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Subject progress */}
        {stats?.subjectProgress && stats.subjectProgress.length > 0 && (
          <div className="mt-8 p-5 rounded-xl border border-border bg-card">
            <h2 className="font-semibold mb-4">Subject Performance</h2>
            <div className="space-y-4">
              {stats.subjectProgress.map(sp => (
                <div key={sp.subjectId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{sp.subjectName}</span>
                    <span className="text-sm text-muted-foreground">{sp.accuracy}% accuracy</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sp.accuracy}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{sp.attempted} of {sp.total} attempted</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
