import { Router } from "express";
import { db, mcqsTable, bookmarksTable, wrongAnswersTable, userAnswersTable, chaptersTable, usersTable } from "@workspace/db";
import { eq, and, inArray, sql, ilike } from "drizzle-orm";
import { requireAuth, requireAdmin, optionalAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/mcqs", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const { chapterId, subjectId, filter, search, limit, offset } = req.query;
  const userId = req.userId;

  let query = db.select().from(mcqsTable);
  const conditions = [];
  if (chapterId) conditions.push(eq(mcqsTable.chapterId, parseInt(chapterId as string, 10)));
  if (subjectId) conditions.push(eq(mcqsTable.subjectId, parseInt(subjectId as string, 10)));
  if (search) conditions.push(ilike(mcqsTable.question, `%${search}%`));

  if (filter === "bookmarked" && userId) {
    const bookmarks = await db.select({ mcqId: bookmarksTable.mcqId }).from(bookmarksTable).where(eq(bookmarksTable.userId, userId));
    const ids = bookmarks.map(b => b.mcqId);
    if (ids.length === 0) {
      res.json({ mcqs: [], total: 0 });
      return;
    }
    conditions.push(inArray(mcqsTable.id, ids));
  } else if (filter === "wrong" && userId) {
    const wrongs = await db.select({ mcqId: wrongAnswersTable.mcqId }).from(wrongAnswersTable).where(eq(wrongAnswersTable.userId, userId));
    const ids = wrongs.map(w => w.mcqId);
    if (ids.length === 0) {
      res.json({ mcqs: [], total: 0 });
      return;
    }
    conditions.push(inArray(mcqsTable.id, ids));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [totalRow] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(mcqsTable).where(whereClause);
  const lim = limit ? parseInt(limit as string, 10) : 50;
  const off = offset ? parseInt(offset as string, 10) : 0;

  const mcqs = whereClause
    ? await db.select().from(mcqsTable).where(whereClause).limit(lim).offset(off).orderBy(mcqsTable.id)
    : await db.select().from(mcqsTable).limit(lim).offset(off).orderBy(mcqsTable.id);

  let bookmarkedIds = new Set<number>();
  let wrongIds = new Set<number>();
  if (userId && mcqs.length > 0) {
    const mcqIds = mcqs.map(m => m.id);
    const bookmarks = await db.select({ mcqId: bookmarksTable.mcqId }).from(bookmarksTable)
      .where(and(eq(bookmarksTable.userId, userId), inArray(bookmarksTable.mcqId, mcqIds)));
    const wrongs = await db.select({ mcqId: wrongAnswersTable.mcqId }).from(wrongAnswersTable)
      .where(and(eq(wrongAnswersTable.userId, userId), inArray(wrongAnswersTable.mcqId, mcqIds)));
    bookmarkedIds = new Set(bookmarks.map(b => b.mcqId));
    wrongIds = new Set(wrongs.map(w => w.mcqId));
  }

  const enriched = mcqs.map(m => ({
    ...m,
    isBookmarked: bookmarkedIds.has(m.id),
    isWrong: wrongIds.has(m.id),
  }));
  res.json({ mcqs: enriched, total: totalRow.count });
});

router.post("/mcqs", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { chapterId, question, options, correctOption, explanation, explanationImage, difficulty, tags } = req.body;
  if (!chapterId || !question || !options || correctOption === undefined) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, chapterId));
  if (!chapter) {
    res.status(404).json({ error: "Chapter not found" });
    return;
  }
  const [mcq] = await db.insert(mcqsTable).values({
    chapterId,
    subjectId: chapter.subjectId,
    question,
    options,
    correctOption,
    explanation: explanation ?? null,
    explanationImage: explanationImage ?? null,
    difficulty: difficulty ?? "medium",
    tags: tags ?? [],
  }).returning();
  res.status(201).json({ ...mcq, isBookmarked: false, isWrong: false });
});

router.post("/mcqs/bulk", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { chapterId, mcqs } = req.body;
  if (!chapterId || !Array.isArray(mcqs) || mcqs.length === 0) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, chapterId));
  if (!chapter) {
    res.status(404).json({ error: "Chapter not found" });
    return;
  }
  const rows = mcqs.map((m: { question: string; options: string[]; correctOption: number; explanation?: string; difficulty?: string }) => ({
    chapterId,
    subjectId: chapter.subjectId,
    question: m.question,
    options: m.options,
    correctOption: m.correctOption,
    explanation: m.explanation ?? null,
    difficulty: m.difficulty ?? "medium",
    tags: [],
  }));
  const created = await db.insert(mcqsTable).values(rows).returning();
  res.status(201).json({ created: created.length, total: created.length, mcqs: created.map(m => ({ ...m, isBookmarked: false, isWrong: false })) });
});

router.get("/mcqs/:id", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [mcq] = await db.select().from(mcqsTable).where(eq(mcqsTable.id, id));
  if (!mcq) {
    res.status(404).json({ error: "MCQ not found" });
    return;
  }
  const userId = req.userId;
  let isBookmarked = false;
  let isWrong = false;
  if (userId) {
    const [bm] = await db.select().from(bookmarksTable).where(and(eq(bookmarksTable.userId, userId), eq(bookmarksTable.mcqId, id)));
    const [wa] = await db.select().from(wrongAnswersTable).where(and(eq(wrongAnswersTable.userId, userId), eq(wrongAnswersTable.mcqId, id)));
    isBookmarked = !!bm;
    isWrong = !!wa;
  }
  res.json({ ...mcq, isBookmarked, isWrong });
});

router.patch("/mcqs/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { question, options, correctOption, explanation, explanationImage, difficulty, tags } = req.body;
  const updates: Record<string, unknown> = {};
  if (question !== undefined) updates.question = question;
  if (options !== undefined) updates.options = options;
  if (correctOption !== undefined) updates.correctOption = correctOption;
  if (explanation !== undefined) updates.explanation = explanation;
  if (explanationImage !== undefined) updates.explanationImage = explanationImage;
  if (difficulty !== undefined) updates.difficulty = difficulty;
  if (tags !== undefined) updates.tags = tags;
  const [mcq] = await db.update(mcqsTable).set(updates).where(eq(mcqsTable.id, id)).returning();
  if (!mcq) {
    res.status(404).json({ error: "MCQ not found" });
    return;
  }
  res.json({ ...mcq, isBookmarked: false, isWrong: false });
});

router.delete("/mcqs/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [mcq] = await db.delete(mcqsTable).where(eq(mcqsTable.id, id)).returning();
  if (!mcq) {
    res.status(404).json({ error: "MCQ not found" });
    return;
  }
  res.json({ message: "MCQ deleted" });
});

router.post("/mcqs/:id/submit", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { selectedOption, examSessionId } = req.body;
  if (selectedOption === undefined) {
    res.status(400).json({ error: "selectedOption is required" });
    return;
  }
  const [mcq] = await db.select().from(mcqsTable).where(eq(mcqsTable.id, id));
  if (!mcq) {
    res.status(404).json({ error: "MCQ not found" });
    return;
  }
  const isCorrect = selectedOption === mcq.correctOption;
  const userId = req.userId!;

  // Record answer
  await db.insert(userAnswersTable).values({
    userId,
    mcqId: id,
    selectedOption,
    isCorrect,
    examSessionId: examSessionId ?? null,
  });

  // Update streak/points
  if (isCorrect) {
    await db.update(usersTable).set({ totalPoints: sql`${usersTable.totalPoints} + 1` }).where(eq(usersTable.id, userId));
    // Remove from wrong answers if they got it right
    await db.delete(wrongAnswersTable).where(and(eq(wrongAnswersTable.userId, userId), eq(wrongAnswersTable.mcqId, id)));
  } else {
    // Upsert wrong answer
    await db.insert(wrongAnswersTable).values({ userId, mcqId: id, selectedOption })
      .onConflictDoUpdate({ target: [wrongAnswersTable.userId, wrongAnswersTable.mcqId], set: { selectedOption } });
  }

  res.json({
    isCorrect,
    correctOption: mcq.correctOption,
    explanation: mcq.explanation,
    explanationImage: mcq.explanationImage,
  });
});

export default router;
