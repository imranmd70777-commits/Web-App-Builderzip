import { Router } from "express";
import { db, wrongAnswersTable, mcqsTable, bookmarksTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/wrong-answers", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const { chapterId, subjectId } = req.query;
  const was = await db.select().from(wrongAnswersTable).where(eq(wrongAnswersTable.userId, userId));
  if (was.length === 0) {
    res.json([]);
    return;
  }
  const mcqIds = was.map(w => w.mcqId);
  let mcqs = await db.select().from(mcqsTable).where(inArray(mcqsTable.id, mcqIds));
  if (chapterId) mcqs = mcqs.filter(m => m.chapterId === parseInt(chapterId as string, 10));
  if (subjectId) mcqs = mcqs.filter(m => m.subjectId === parseInt(subjectId as string, 10));
  const bms = await db.select({ mcqId: bookmarksTable.mcqId }).from(bookmarksTable)
    .where(and(eq(bookmarksTable.userId, userId), inArray(bookmarksTable.mcqId, mcqs.map(m => m.id))));
  const bmSet = new Set(bms.map(b => b.mcqId));
  res.json(mcqs.map(m => ({ ...m, isBookmarked: bmSet.has(m.id), isWrong: true })));
});

router.delete("/wrong-answers/:mcqId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const mcqId = parseInt(Array.isArray(req.params.mcqId) ? req.params.mcqId[0] : req.params.mcqId, 10);
  const userId = req.userId!;
  await db.delete(wrongAnswersTable).where(and(eq(wrongAnswersTable.userId, userId), eq(wrongAnswersTable.mcqId, mcqId)));
  res.json({ message: "Wrong answer cleared" });
});

export default router;
