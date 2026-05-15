import { motion } from "framer-motion";
import { useGetLeaderboard } from "@workspace/api-client-react";
import type { LeaderboardEntry } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { Trophy, Medal, Star, Crown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { data: leaders, isLoading } = useGetLeaderboard();
  const { user } = useAuth();
  const list: LeaderboardEntry[] = leaders ?? [];

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={16} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={16} className="text-gray-300" />;
    if (rank === 3) return <Medal size={16} className="text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">{rank}</span>;
  };

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Trophy size={24} className="text-yellow-400" /> Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm">Top students ranked by total points</p>
        </div>

        {/* Top 3 podium */}
        {!isLoading && list.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-10 px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 max-w-[160px]">
              <div className="text-center mb-2">
                <div className="w-14 h-14 rounded-full bg-gray-500/20 border-2 border-gray-400 flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                  {list[1].name.charAt(0)}
                </div>
                <p className="text-sm font-semibold truncate">{list[1].name}</p>
                <p className="text-xs text-muted-foreground">{list[1].totalPoints} pts</p>
              </div>
              <div className="h-20 rounded-t-xl bg-gray-500/20 border border-gray-500/30 flex items-center justify-center">
                <Medal size={24} className="text-gray-300" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 max-w-[160px]">
              <div className="text-center mb-2">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                  {list[0].name.charAt(0)}
                </div>
                <p className="text-sm font-semibold truncate">{list[0].name}</p>
                <p className="text-xs text-yellow-400 font-semibold">{list[0].totalPoints} pts</p>
              </div>
              <div className="h-28 rounded-t-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                <Crown size={28} className="text-yellow-400" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-1 max-w-[160px]">
              <div className="text-center mb-2">
                <div className="w-14 h-14 rounded-full bg-amber-700/20 border-2 border-amber-700 flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                  {list[2].name.charAt(0)}
                </div>
                <p className="text-sm font-semibold truncate">{list[2].name}</p>
                <p className="text-xs text-muted-foreground">{list[2].totalPoints} pts</p>
              </div>
              <div className="h-14 rounded-t-xl bg-amber-700/20 border border-amber-700/30 flex items-center justify-center">
                <Medal size={20} className="text-amber-600" />
              </div>
            </motion.div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {list.map((leader, i) => (
              <motion.div key={leader.userId} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className={cn("flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors",
                  leader.userId === user?.id ? "border-primary/50 bg-primary/5" : "border-border bg-card"
                )}>
                <div className="w-8 flex items-center justify-center">{rankIcon(leader.rank)}</div>
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {leader.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {leader.name}
                    {leader.userId === user?.id && <span className="ml-2 text-xs text-primary">(You)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{Math.round(leader.accuracy)}% accuracy • {leader.streakDays}d streak</p>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 font-semibold">
                  <Star size={14} className="fill-current" />
                  <span className="text-sm">{leader.totalPoints}</span>
                </div>
              </motion.div>
            ))}
            {list.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                <p>No rankings yet. Take some exams to appear on the leaderboard!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
