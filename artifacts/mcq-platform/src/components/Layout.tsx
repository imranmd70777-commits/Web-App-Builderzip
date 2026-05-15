import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  LayoutDashboard, BookOpen, Trophy, BarChart2, Bookmark, XCircle,
  LogOut, User, Shield, ChevronRight, Menu, X, Zap, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";

const studentNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/wrong-answers", label: "Wrong Answers", icon: XCircle },
  { href: "/results", label: "My Results", icon: BarChart2 },
  { href: "/progress", label: "Progress", icon: ChevronRight },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const adminNav = [
  { href: "/admin", label: "Admin Dashboard", icon: Shield },
  { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
  { href: "/admin/chapters", label: "Chapters", icon: BookOpen },
  { href: "/admin/mcqs", label: "MCQs", icon: Zap },
  { href: "/admin/bulk-import", label: "Bulk Import", icon: Upload },
  { href: "/admin/users", label: "Users", icon: User },
  { href: "/admin/reports", label: "Reports", icon: BarChart2 },
];

function NavLink({ href, label, icon: Icon, onClick }: { href: string; label: string; icon: any; onClick?: () => void }) {
  const [location] = useLocation();
  const active = location === href || (href !== "/dashboard" && href !== "/admin" && location.startsWith(href));
  return (
    <Link href={href} onClick={onClick}>
      <div className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
        active
          ? "bg-primary/20 text-primary border border-primary/30"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}>
        <Icon size={16} className={active ? "text-primary" : ""} />
        {label}
      </div>
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout, isAdmin } = useAuth();
  const nav = isAdmin ? [...adminNav, ...studentNav] : studentNav;

  return (
    <div className="flex flex-col h-full bg-[hsl(240_10%_4%)] border-r border-border">
      <div className="p-6 border-b border-border">
        <Link href={isAdmin ? "/admin" : "/dashboard"} onClick={onClose}>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">QuizMaster Pro</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {nav.map(item => (
          <NavLink key={item.href} {...item} onClick={onClose} />
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <Link href="/profile" onClick={onClose}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </Link>
        <button
          onClick={() => { logout(); if (onClose) onClose(); }}
          className="flex items-center gap-3 px-4 py-2 w-full text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 flex-shrink-0">
        <div className="w-full">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-72 z-50 md:hidden"
            >
              <Sidebar onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
          <button onClick={() => setMobileOpen(true)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="font-bold text-sm">QuizMaster Pro</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
