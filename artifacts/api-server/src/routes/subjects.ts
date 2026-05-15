import { Router } from "express";
import { db, subjectsTable, chaptersTable, mcqsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/subjects", async (_req, res): Promise<void> => {
  const subjects = await db.select().from(subjectsTable).orderBy(subjectsTable.order, subjectsTable.name);
  const chapterCounts = await db
    .select({ subjectId: chaptersTable.subjectId, count: sql<number>`count(*)`.mapWith(Number) })
    .from(chaptersTable)
    .groupBy(chaptersTable.subjectId);
  const mcqCounts = await db
    .select({ subjectId: mcqsTable.subjectId, count: sql<number>`count(*)`.mapWith(Number) })
    .from(mcqsTable)
    .groupBy(mcqsTable.subjectId);

  const ccMap = new Map(chapterCounts.map(c => [c.subjectId, c.count]));
  const mcqMap = new Map(mcqCounts.map(m => [m.subjectId, m.count]));

  const result = subjects.map(s => ({
    ...s,
    chapterCount: ccMap.get(s.id) ?? 0,
    mcqCount: mcqMap.get(s.id) ?? 0,
  }));
  res.json(result);
});

router.post("/subjects", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { name, description, icon, color, order } = req.body;
  if (!name || !description || !icon || !color) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [subject] = await db.insert(subjectsTable).values({
    name, description, icon, color, order: order ?? 0,
  }).returning();
  res.status(201).json({ ...subject, chapterCount: 0, mcqCount: 0 });
});

router.get("/subjects/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, id));
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  const [chapterCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(chaptersTable)
    .where(eq(chaptersTable.subjectId, id));
  const [mcqCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(mcqsTable)
    .where(eq(mcqsTable.subjectId, id));
  res.json({ ...subject, chapterCount: chapterCount.count, mcqCount: mcqCount.count });
});

router.patch("/subjects/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, description, icon, color, isActive, order } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (icon !== undefined) updates.icon = icon;
  if (color !== undefined) updates.color = color;
  if (isActive !== undefined) updates.isActive = isActive;
  if (order !== undefined) updates.order = order;

  const [subject] = await db.update(subjectsTable).set(updates).where(eq(subjectsTable.id, id)).returning();
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  const [chapterCount] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(chaptersTable).where(eq(chaptersTable.subjectId, id));
  const [mcqCount] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(mcqsTable).where(eq(mcqsTable.subjectId, id));
  res.json({ ...subject, chapterCount: chapterCount.count, mcqCount: mcqCount.count });
});

router.delete("/subjects/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [subject] = await db.delete(subjectsTable).where(eq(subjectsTable.id, id)).returning();
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json({ message: "Subject deleted" });
});

export default router;
