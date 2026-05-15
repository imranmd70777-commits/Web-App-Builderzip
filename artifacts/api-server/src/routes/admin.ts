import { Router } from "express";
import { db, usersTable, mcqsTable, subjectsTable, chaptersTable, examSessionsTable, examResultsTable } from "@workspace/db";
import { eq, ilike, and, sql, desc, avg, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/admin/users", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const { search, role, limit, offset } = req.query;
  const conditions = [];
  if (search) conditions.push(ilike(usersTable.name, `%${search}%`));
  if (role) conditions.push(eq(usersTable.role, role as string));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [total] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(usersTable).where(where);
  const lim = limit ? parseInt(limit as string, 10) : 50;
  const off = offset ? parseInt(offset as string, 10) : 0;
  const users = where
    ? await db.select().from(usersTable).where(where).limit(lim).offset(off).orderBy(desc(usersTable.createdAt))
    : await db.select().from(usersTable).limit(lim).offset(off).orderBy(desc(usersTable.createdAt));

  res.json({
    users: users.map(({ passwordHash: _, ...u }) => u),
    total: total.count,
  });
});

router.patch("/admin/users/:id", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { role, isPremium, isBanned } = req.body;
  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (isPremium !== undefined) updates.isPremium = isPremium;
  if (isBanned !== undefined) updates.isBanned = isBanned;
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _, ...userOut } = user;
  res.json(userOut);
});

router.post("/admin/users/:id/ban", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { banned } = req.body;
  await db.update(usersTable).set({ isBanned: !!banned }).where(eq(usersTable.id, id));
  res.json({ message: banned ? "User banned" : "User unbanned" });
});

router.get("/admin/stats", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const [totalUsers] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(usersTable);
  const [totalStudents] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(usersTable).where(eq(usersTable.role, "student"));
  const [totalMcqs] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(mcqsTable);
  const [totalSubjects] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(subjectsTable);
  const [totalChapters] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(chaptersTable);
  const [totalExams] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(examSessionsTable);
  const [premiumUsers] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(usersTable).where(eq(usersTable.isPremium, true));
  const [bannedUsers] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(usersTable).where(eq(usersTable.isBanned, true));
  const recentReg = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(5);

  res.json({
    totalUsers: totalUsers.count,
    totalStudents: totalStudents.count,
    totalMcqs: totalMcqs.count,
    totalSubjects: totalSubjects.count,
    totalChapters: totalChapters.count,
    totalExams: totalExams.count,
    premiumUsers: premiumUsers.count,
    bannedUsers: bannedUsers.count,
    recentRegistrations: recentReg.map(({ passwordHash: _, ...u }) => u),
  });
});

router.get("/admin/reports/subjects", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const subjects = await db.select().from(subjectsTable);
  const result = [];

  for (const s of subjects) {
    const [mcqCount] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(mcqsTable).where(eq(mcqsTable.subjectId, s.id));
    const [chapterCount] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(chaptersTable).where(eq(chaptersTable.subjectId, s.id));
    const subjectSessionIds = await db.select({ id: examSessionsTable.id }).from(examSessionsTable).where(eq(examSessionsTable.subjectId, s.id));
    const examCount = subjectSessionIds.length;
    const sessionIds = subjectSessionIds.map(r => r.id);
    let avgAccuracy = 0;
    if (sessionIds.length > 0) {
      const [acc] = await db.select({ avg: avg(examResultsTable.accuracy) }).from(examResultsTable).where(inArray(examResultsTable.examSessionId, sessionIds));
      avgAccuracy = acc?.avg != null ? Math.round(Number(acc.avg)) : 0;
    }

    result.push({
      subjectId: s.id,
      subjectName: s.name,
      totalMcqs: mcqCount.count,
      totalAttempts: examCount,
      avgAccuracy,
      chapterCount: chapterCount.count,
    });
  }

  res.json(result);
});

export default router;
