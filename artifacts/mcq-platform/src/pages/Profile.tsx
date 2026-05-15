import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { User, Mail, Phone, Star, Flame, Shield, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { user, isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);

  if (!user) return null;

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Profile</h1>
          <p className="text-muted-foreground text-sm">Your account details and stats</p>
        </div>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl border border-border bg-card mb-6">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl font-bold text-primary flex-shrink-0">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{user.name}</h2>
                {isAdmin && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <Shield size={10} /> Admin
                  </span>
                )}
                {user.isPremium && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    <Star size={10} /> Premium
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.phone && <p className="text-sm text-muted-foreground">{user.phone}</p>}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-background border border-border">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star size={14} className="text-yellow-400" />
              </div>
              <p className="text-2xl font-bold">{user.totalPoints ?? 0}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-background border border-border">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame size={14} className="text-orange-400" />
              </div>
              <p className="text-2xl font-bold">{user.streakDays ?? 0}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-background border border-border">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Shield size={14} className="text-primary" />
              </div>
              <p className="text-2xl font-bold capitalize">{user.role}</p>
              <p className="text-xs text-muted-foreground">Role</p>
            </div>
          </div>
        </motion.div>

        {/* Account info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold mb-5">Account Information</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <User size={16} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Full name</p>
                <p className="text-sm font-medium">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Mail size={16} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email address</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                  <Phone size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{user.phone}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Member since {new Date(user.createdAt ?? Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
