import { Router } from "express";
import { db, examSessionsTable, examResultsTable, mcqsTable, chaptersTable, wrongAnswersTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/exams", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const sessions = await db.select().from(examSessionsTable).where(eq(examSessionsTable.userId, userId)).orderBy(examSessionsTable.createdAt);
  const result = [];
  for (const s of sessions) {
    const mcqs = s.mcqIds.length > 0
      ? await db.select().from(mcqsTable).where(inArray(mcqsTable.id, s.mcqIds))
      : [];
    result.push({
      ...s,
      timeLimitMinutes: s.timeLimitMinutes ?? null,
      completedAt: s.completedAt ? s.completedAt.toISOString() : null,
      startedAt: s.startedAt.toISOString(),
      mcqs: mcqs.map(m => ({ ...m, isBookmarked: false, isWrong: false })),
    });
  }
  res.json(result);
});

router.post("/exams", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const { type, subjectId, chapterIds, questionCount, timeLimitMinutes } = req.body;
  if (!type) {
    res.status(400).json({ error: "type is required" });
    return;
  }

  let mcqQuery = db.select().from(mcqsTable);
  const conditions = [];
  if (type === "wrong") {
    const wrongs = await db.select({ mcqId: wrongAnswersTable.mcqId }).from(wrongAnswersTable).where(eq(wrongAnswersTable.userId, userId));
    if (wrongs.length === 0) {
      res.status(400).json({ error: "No wrong answers to practice" });
      return;
    }
    conditions.push(inArray(mcqsTable.id, wrongs.map(w => w.mcqId)));
  } else {
    if (subjectId) conditions.push(eq(mcqsTable.subjectId, subjectId));
    if (chapterIds?.length > 0) conditions.push(inArray(mcqsTable.chapterId, chapterIds));
  }

  const allMcqs = conditions.length > 0
    ? await mcqQuery.where(and(...conditions))
    : await mcqQuery;

  const shuffled = allMcqs.sort(() => Math.random() - 0.5);
  const limit = questionCount ?? 20;
  const selected = shuffled.slice(0, limit);

  const chapterIdsUsed = [...new Set(selected.map(m => m.chapterId))];
  const [session] = await db.insert(examSessionsTable).values({
    userId,
    type,
    status: "active",
    mcqIds: selected.map(m => m.id),
    chapterIds: chapterIdsUsed,
    subjectId: subjectId ?? null,
    timeLimitMinutes: timeLimitMinutes ?? null,
    startedAt: new Date(),
  }).returning();

  res.status(201).json({
    ...session,
    timeLimitMinutes: session.timeLimitMinutes ?? null,
    completedAt: null,
    startedAt: session.startedAt.toISOString(),
    mcqs: selected.map(m => ({ ...m, isBookmarked: false, isWrong: false })),
  });
});

router.get("/exams/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [session] = await db.select().from(examSessionsTable).where(and(eq(examSessionsTable.id, id), eq(examSessionsTable.userId, req.userId!)));
  if (!session) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }
  const mcqs = session.mcqIds.length > 0
    ? await db.select().from(mcqsTable).where(inArray(mcqsTable.id, session.mcqIds))
    : [];
  res.json({
    ...session,
    timeLimitMinutes: session.timeLimitMinutes ?? null,
    completedAt: session.completedAt ? session.completedAt.toISOString() : null,
    startedAt: session.startedAt.toISOString(),
    mcqs: mcqs.map(m => ({ ...m, isBookmarked: false, isWrong: false })),
  });
});

router.post("/exams/:id/submit", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const userId = req.userId!;
  const [session] = await db.select().from(examSessionsTable).where(and(eq(examSessionsTable.id, id), eq(examSessionsTable.userId, userId)));
  if (!session) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }
  const { answers } = req.body;
  if (!Array.isArray(answers)) {
    res.status(400).json({ error: "answers array required" });
    return;
  }

  const mcqs = session.mcqIds.length > 0
    ? await db.select().from(mcqsTable).where(inArray(mcqsTable.id, session.mcqIds))
    : [];
  const mcqMap = new Map(mcqs.map(m => [m.id, m]));
  let score = 0;
  const chapterMap = new Map<number, { correct: number; total: number }>();

  for (const answer of answers as { mcqId: number; selectedOption: number }[]) {
    const mcq = mcqMap.get(answer.mcqId);
    if (!mcq) continue;
    const isCorrect = answer.selectedOption === mcq.correctOption;
    if (isCorrect) score++;

    const chId = mcq.chapterId;
    const existing = chapterMap.get(chId) ?? { correct: 0, total: 0 };
    existing.total++;
    if (isCorrect) existing.correct++;
    chapterMap.set(chId, existing);

    if (!isCorrect) {
      await db.insert(wrongAnswersTable).values({ userId, mcqId: mcq.id, selectedOption: answer.selectedOption })
        .onConflictDoUpdate({ target: [wrongAnswersTable.userId, wrongAnswersTable.mcqId], set: { selectedOption: answer.selectedOption } });
    } else {
      await db.delete(wrongAnswersTable).where(and(eq(wrongAnswersTable.userId, userId), eq(wrongAnswersTable.mcqId, mcq.id)));
    }
  }

  const total = answers.length;
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
  const now = new Date();
  const timeTakenSeconds = Math.round((now.getTime() - session.startedAt.getTime()) / 1000);

  await db.update(examSessionsTable).set({ status: "completed", completedAt: now }).where(eq(examSessionsTable.id, id));

  const chapterIds = [...chapterMap.keys()];
  const chapters = chapterIds.length > 0
    ? await db.select().from(chaptersTable).where(inArray(chaptersTable.id, chapterIds))
    : [];
  const chapterNameMap = new Map(chapters.map(c => [c.id, c.name]));

  const chapterBreakdown = chapterIds.map(chId => ({
    chapterId: chId,
    chapterName: chapterNameMap.get(chId) ?? "Unknown",
    correct: chapterMap.get(chId)!.correct,
    total: chapterMap.get(chId)!.total,
  }));

  const [result] = await db.insert(examResultsTable).values({
    examSessionId: id,
    userId,
    score,
    total,
    accuracy,
    timeTakenSeconds,
    answers: JSON.stringify(answers),
    chapterBreakdown: JSON.stringify(chapterBreakdown),
  }).returning();

  res.json({
    ...result,
    chapterBreakdown,
    createdAt: result.createdAt.toISOString(),
  });
});

export default router;
