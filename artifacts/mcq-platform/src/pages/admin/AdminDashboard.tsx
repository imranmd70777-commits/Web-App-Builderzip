import { motion } from "framer-motion";
import { Link } from "wouter";
import { useAdminGetStats } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { Users, BookOpen, Zap, BarChart2, Shield, ChevronRight } from "lucide-react";

function AdminStatCard({ icon: Icon, label, value, href, color }: { icon: any; label: string; value: number | string; href?: string; color: string }) {
  const content = (
    <div className={`p-5 rounded-xl border border-border bg-card transition-colors ${href ? "hover:border-primary/30 cursor-pointer" : ""}`}>
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="text-2xl font-bold mb-0.5">{value}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {href && <ChevronRight size={14} className="text-muted-foreground" />}
      </div>
    </div>
  );
  return href ? <Link href={href}><div>{content}</div></Link> : <div>{content}</div>;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminGetStats();

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Shield size={20} className="text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Platform overview and management</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-card border border-border animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <AdminStatCard icon={Users} label="Total Students" value={stats?.totalStudents ?? 0} href="/admin/users" color="bg-blue-500" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
                <AdminStatCard icon={BookOpen} label="Subjects" value={stats?.totalSubjects ?? 0} href="/admin/subjects" color="bg-purple-500" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <AdminStatCard icon={BookOpen} label="Chapters" value={stats?.totalChapters ?? 0} href="/admin/chapters" color="bg-indigo-500" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                <AdminStatCard icon={Zap} label="MCQs" value={stats?.totalMcqs ?? 0} href="/admin/mcqs" color="bg-primary" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                <AdminStatCard icon={BarChart2} label="Total Exams" value={stats?.totalExams ?? 0} color="bg-green-500" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30 }}>
                <AdminStatCard icon={Users} label="Premium Users" value={stats?.premiumUsers ?? 0} color="bg-yellow-500" />
              </motion.div>
            </div>

            {/* Quick links */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { href: "/admin/subjects", label: "Manage Subjects", desc: "Add, edit or remove subjects", icon: BookOpen },
                { href: "/admin/chapters", label: "Manage Chapters", desc: "Organize chapters within subjects", icon: BookOpen },
                { href: "/admin/mcqs", label: "Manage MCQs", desc: "Add, edit or delete questions", icon: Zap },
                { href: "/admin/users", label: "Manage Users", desc: "View and manage student accounts", icon: Users },
                { href: "/admin/reports", label: "Analytics & Reports", desc: "View platform-wide analytics", icon: BarChart2 },
              ].map((link, i) => (
                <motion.div key={link.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link href={link.href}>
                    <div className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer group">
                      <link.icon size={18} className="text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{link.label}</h3>
                      <p className="text-xs text-muted-foreground">{link.desc}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
