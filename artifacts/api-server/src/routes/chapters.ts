import { Router } from "express";
import { db, chaptersTable, mcqsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/subjects/:subjectId/chapters", async (req, res): Promise<void> => {
  const subjectId = parseInt(Array.isArray(req.params.subjectId) ? req.params.subjectId[0] : req.params.subjectId, 10);
  const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.subjectId, subjectId)).orderBy(chaptersTable.order, chaptersTable.name);
  const mcqCounts = await db
    .select({ chapterId: mcqsTable.chapterId, count: sql<number>`count(*)`.mapWith(Number) })
    .from(mcqsTable)
    .where(eq(mcqsTable.subjectId, subjectId))
    .groupBy(mcqsTable.chapterId);
  const mcqMap = new Map(mcqCounts.map(m => [m.chapterId, m.count]));
  res.json(chapters.map(c => ({ ...c, mcqCount: mcqMap.get(c.id) ?? 0 })));
});

router.post("/subjects/:subjectId/chapters", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const subjectId = parseInt(Array.isArray(req.params.subjectId) ? req.params.subjectId[0] : req.params.subjectId, 10);
  const { name, description, order } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const [chapter] = await db.insert(chaptersTable).values({
    subjectId, name, description: description ?? "", order: order ?? 0,
  }).returning();
  res.status(201).json({ ...chapter, mcqCount: 0 });
});

router.get("/chapters/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, id));
  if (!chapter) {
    res.status(404).json({ error: "Chapter not found" });
    return;
  }
  const [mcqCount] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(mcqsTable).where(eq(mcqsTable.chapterId, id));
  res.json({ ...chapter, mcqCount: mcqCount.count });
});

router.patch("/chapters/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, description, order, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (order !== undefined) updates.order = order;
  if (isActive !== undefined) updates.isActive = isActive;
  const [chapter] = await db.update(chaptersTable).set(updates).where(eq(chaptersTable.id, id)).returning();
  if (!chapter) {
    res.status(404).json({ error: "Chapter not found" });
    return;
  }
  const [mcqCount] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(mcqsTable).where(eq(mcqsTable.chapterId, id));
  res.json({ ...chapter, mcqCount: mcqCount.count });
});

router.delete("/chapters/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [chapter] = await db.delete(chaptersTable).where(eq(chaptersTable.id, id)).returning();
  if (!chapter) {
    res.status(404).json({ error: "Chapter not found" });
    return;
  }
  res.json({ message: "Chapter deleted" });
});

export default router;
