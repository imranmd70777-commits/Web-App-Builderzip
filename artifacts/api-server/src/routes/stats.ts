import { Router } from "express";
import { db, userAnswersTable, usersTable, subjectsTable, chaptersTable, mcqsTable, examResultsTable, wrongAnswersTable } from "@workspace/db";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/stats/dashboard", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  const [totals] = await db.select({
    total: sql<number>`count(*)`.mapWith(Number),
    correct: sql<number>`sum(case when is_correct then 1 else 0 end)`.mapWith(Number),
  }).from(userAnswersTable).where(eq(userAnswersTable.userId, userId));

  const subjectProgress = await db
    .select({
      subjectId: mcqsTable.subjectId,
      attempted: sql<number>`count(*)`.mapWith(Number),
      correct: sql<number>`sum(case when ${userAnswersTable.isCorrect} then 1 else 0 end)`.mapWith(Number),
    })
    .from(userAnswersTable)
    .innerJoin(mcqsTable, eq(userAnswersTable.mcqId, mcqsTable.id))
    .where(eq(userAnswersTable.userId, userId))
    .groupBy(mcqsTable.subjectId);

  const subjects = await db.select().from(subjectsTable);
  const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
  const mcqCountBySubject = await db
    .select({ subjectId: mcqsTable.subjectId, total: sql<number>`count(*)`.mapWith(Number) })
    .from(mcqsTable)
    .groupBy(mcqsTable.subjectId);
  const mcqCountMap = new Map(mcqCountBySubject.map(m => [m.subjectId, m.total]));

  const recentActivity: { date: string; mcqsAttempted: number; correctAnswers: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const [dayStats] = await db.select({
      total: sql<number>`count(*)`.mapWith(Number),
      correct: sql<number>`sum(case when is_correct then 1 else 0 end)`.mapWith(Number),
    }).from(userAnswersTable)
      .where(and(
        eq(userAnswersTable.userId, userId),
        sql`date(${userAnswersTable.createdAt}) = ${dateStr}`,
      ));
    recentActivity.push({ date: dateStr, mcqsAttempted: dayStats.total, correctAnswers: dayStats.correct ?? 0 });
  }

  const wrongAnswers = await db.select({ mcqId: wrongAnswersTable.mcqId }).from(wrongAnswersTable).where(eq(wrongAnswersTable.userId, userId));
  const weakChapters: { chapterId: number; chapterName: string; subjectName: string; accuracy: number }[] = [];
  if (wrongAnswers.length > 0) {
    const wrongMcqs = await db.select({ chapterId: mcqsTable.chapterId, subjectId: mcqsTable.subjectId })
      .from(mcqsTable).where(inArray(mcqsTable.id, wrongAnswers.map(w => w.mcqId)));
    const chapterWrongMap = new Map<number, { subjectId: number; count: number }>();
    for (const m of wrongMcqs) {
      const e = chapterWrongMap.get(m.chapterId) ?? { subjectId: m.subjectId, count: 0 };
      e.count++;
      chapterWrongMap.set(m.chapterId, e);
    }
    const chapterIds = [...chapterWrongMap.keys()];
    if (chapterIds.length > 0) {
      const chapters = await db.select().from(chaptersTable).where(inArray(chaptersTable.id, chapterIds));
      for (const c of chapters.slice(0, 5)) {
        weakChapters.push({
          chapterId: c.id,
          chapterName: c.name,
          subjectName: subjectMap.get(c.subjectId) ?? "Unknown",
          accuracy: Math.max(0, 100 - (chapterWrongMap.get(c.id)?.count ?? 0) * 10),
        });
      }
    }
  }

  const totalAttempted = totals.total ?? 0;
  const totalCorrect = totals.correct ?? 0;

  res.json({
    totalMcqsAttempted: totalAttempted,
    totalCorrect,
    accuracy: totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0,
    streakDays: user.streakDays,
    totalPoints: user.totalPoints,
    subjectProgress: subjectProgress.map(sp => ({
      subjectId: sp.subjectId,
      subjectName: subjectMap.get(sp.subjectId) ?? "Unknown",
      attempted: sp.attempted,
      total: mcqCountMap.get(sp.subjectId) ?? 0,
      accuracy: sp.attempted > 0 ? Math.round(((sp.correct ?? 0) / sp.attempted) * 100) : 0,
    })),
    recentActivity,
    weakChapters,
  });
});

router.get("/stats/leaderboard", requireAuth, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable)
    .where(eq(usersTable.isBanned, false))
    .orderBy(desc(usersTable.totalPoints))
    .limit(20);

  res.json(users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    name: u.name,
    avatar: u.avatar,
    totalPoints: u.totalPoints,
    accuracy: 0,
    streakDays: u.streakDays,
  })));
});

router.get("/stats/progress", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const subjects = await db.select().from(subjectsTable).where(eq(subjectsTable.isActive, true));
  const result = [];

  for (const subject of subjects) {
    const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.subjectId, subject.id));
    const chapterProgress = [];

    for (const chapter of chapters) {
      const totalMcqs = await db.select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(mcqsTable).where(eq(mcqsTable.chapterId, chapter.id));

      const [attempted] = await db.select({
        count: sql<number>`count(distinct ${userAnswersTable.mcqId})`.mapWith(Number),
        correct: sql<number>`sum(case when ${userAnswersTable.isCorrect} then 1 else 0 end)`.mapWith(Number),
      }).from(userAnswersTable)
        .innerJoin(mcqsTable, eq(userAnswersTable.mcqId, mcqsTable.id))
        .where(and(eq(userAnswersTable.userId, userId), eq(mcqsTable.chapterId, chapter.id)));

      chapterProgress.push({
        chapterId: chapter.id,
        chapterName: chapter.name,
        attempted: attempted.count,
        total: totalMcqs[0]?.count ?? 0,
        accuracy: attempted.count > 0 ? Math.round(((attempted.correct ?? 0) / attempted.count) * 100) : 0,
      });
    }

    result.push({ subjectId: subject.id, subjectName: subject.name, chapters: chapterProgress });
  }

  res.json(result);
});

export default router;
