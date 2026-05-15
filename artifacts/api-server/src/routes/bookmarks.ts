import { Router } from "express";
import { db, bookmarksTable, mcqsTable, wrongAnswersTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/bookmarks", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const bms = await db.select().from(bookmarksTable).where(eq(bookmarksTable.userId, userId));
  if (bms.length === 0) {
    res.json([]);
    return;
  }
  const mcqIds = bms.map(b => b.mcqId);
  const mcqs = await db.select().from(mcqsTable).where(inArray(mcqsTable.id, mcqIds));
  const wrongs = await db.select({ mcqId: wrongAnswersTable.mcqId }).from(wrongAnswersTable)
    .where(and(eq(wrongAnswersTable.userId, userId), inArray(wrongAnswersTable.mcqId, mcqIds)));
  const wrongSet = new Set(wrongs.map(w => w.mcqId));
  res.json(mcqs.map(m => ({ ...m, isBookmarked: true, isWrong: wrongSet.has(m.id) })));
});

router.post("/bookmarks/:mcqId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const mcqId = parseInt(Array.isArray(req.params.mcqId) ? req.params.mcqId[0] : req.params.mcqId, 10);
  const userId = req.userId!;
  await db.insert(bookmarksTable).values({ userId, mcqId }).onConflictDoNothing();
  res.json({ message: "Bookmarked" });
});

router.delete("/bookmarks/:mcqId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const mcqId = parseInt(Array.isArray(req.params.mcqId) ? req.params.mcqId[0] : req.params.mcqId, 10);
  const userId = req.userId!;
  await db.delete(bookmarksTable).where(and(eq(bookmarksTable.userId, userId), eq(bookmarksTable.mcqId, mcqId)));
  res.json({ message: "Bookmark removed" });
});

export default router;
