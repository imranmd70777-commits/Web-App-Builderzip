import { useState } from "react";
import { motion } from "framer-motion";
import { useAdminGetUsers, useBanUser } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { Users, Ban, CheckCircle, Search, Star, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminUsers() {
  const { data, isLoading, refetch } = useAdminGetUsers();
  const banMut = useBanUser();
  const [search, setSearch] = useState("");

  const allUsers = (data as any)?.users ?? [];
  const users = allUsers.filter((u: any) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleBan = async (id: number, isBanned: boolean) => {
    if (!isBanned) {
      if (!confirm("Ban this user? They will not be able to log in.")) return;
    }
    await banMut.mutateAsync({ id, data: { banned: !isBanned } });
    refetch();
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Users</h1>
          <p className="text-muted-foreground text-sm">{users.length} users</p>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full max-w-sm pl-9 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground" />
        </div>

        {isLoading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />)}</div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-3 bg-secondary/50 text-xs font-medium text-muted-foreground border-b border-border">
              <span className="col-span-5">User</span>
              <span className="col-span-2">Role</span>
              <span className="col-span-2 hidden sm:block">Points</span>
              <span className="col-span-2 hidden sm:block">Streak</span>
              <span className="col-span-1 text-right">Ban</span>
            </div>
            <div className="divide-y divide-border">
              {users.map((user: any, i: number) => (
                <motion.div key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-12 items-center px-4 py-3">
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {user.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      user.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                    )}>
                      {user.role}
                    </span>
                    {user.isPremium && <Star size={12} className="inline ml-1 text-yellow-400" />}
                    {user.isBanned && <Ban size={12} className="inline ml-1 text-red-400" />}
                  </div>
                  <div className="col-span-2 hidden sm:flex items-center gap-1 text-sm">
                    <Star size={12} className="text-yellow-400" /> {user.totalPoints ?? 0}
                  </div>
                  <div className="col-span-2 hidden sm:flex items-center gap-1 text-sm">
                    <Flame size={12} className="text-orange-400" /> {user.streakDays ?? 0}d
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    {user.role !== "admin" && (
                      <button onClick={() => handleToggleBan(user.id, user.isBanned ?? false)}
                        className={cn("p-2 rounded-lg transition-colors",
                          user.isBanned ? "hover:bg-green-500/10 text-muted-foreground hover:text-green-400" : "hover:bg-destructive/10 text-muted-foreground hover:text-red-400"
                        )}>
                        {user.isBanned ? <CheckCircle size={16} /> : <Ban size={16} />}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        {!isLoading && users.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>No users found.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
