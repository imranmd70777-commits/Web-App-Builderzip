import { Link } from "wouter";
import { motion } from "framer-motion";
import { Zap, BookOpen, Trophy, BarChart2, Shield, CheckCircle, ArrowRight, Star } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Chapter-wise Practice", desc: "Drill MCQs by subject and chapter at your own pace with instant feedback" },
  { icon: Zap, title: "Timed Exams", desc: "Simulate real exam pressure with auto-submitting timed sessions" },
  { icon: BarChart2, title: "Smart Analytics", desc: "Track accuracy, identify weak chapters, and monitor your streak" },
  { icon: Trophy, title: "Leaderboard", desc: "Compete with students across all subjects and climb the rankings" },
  { icon: Shield, title: "Wrong Answer Review", desc: "Automatically bookmark every mistake and retry until you get it right" },
  { icon: Star, title: "Custom Exams", desc: "Pick any combination of chapters and build your own exam set" },
];

const stats = [
  { value: "10,000+", label: "Questions" },
  { value: "500+", label: "Students" },
  { value: "4", label: "Subjects" },
  { value: "98%", label: "Accuracy Improved" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg">QuizMaster Pro</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </button>
            </Link>
            <Link href="/register">
              <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                Get started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
              <Zap size={12} />
              The smarter way to prepare
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
              Ace every exam with{" "}
              <span className="text-primary">focused practice</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              QuizMaster Pro is the precision exam tool serious students rely on.
              Practice chapter-wise MCQs, take timed exams, and track exactly where you stand.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                  Start practicing free
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
              <Link href="/login">
                <button className="px-8 py-3.5 border border-border text-foreground font-semibold rounded-xl hover:bg-secondary transition-colors">
                  Sign in
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-border bg-card/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-primary mb-1">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Everything you need to score higher</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Every feature is designed around one goal: making your study time count.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon size={18} className="text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-card/20 border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground mb-12">Three steps to exam readiness</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Choose your subject", desc: "Browse subjects and chapters, then pick what you want to practice or test yourself on." },
              { step: "02", title: "Practice or take an exam", desc: "Work through MCQs with instant explanations, or take a full timed exam under real conditions." },
              { step: "03", title: "Review and improve", desc: "Check your results, review wrong answers, and focus on chapters where your accuracy is lowest." },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-sm font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
          <p className="text-muted-foreground mb-8">Join students already using QuizMaster Pro to study smarter and score higher.</p>
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 mx-auto"
            >
              Create free account
              <ArrowRight size={18} />
            </motion.button>
          </Link>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-border text-center text-sm text-muted-foreground">
        <p>QuizMaster Pro — built for serious learners.</p>
      </footer>
    </div>
  );
}
