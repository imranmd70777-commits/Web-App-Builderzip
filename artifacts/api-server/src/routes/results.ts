import { Router } from "express";
import { db, examResultsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/results", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const results = await db.select().from(examResultsTable).where(eq(examResultsTable.userId, userId)).orderBy(examResultsTable.createdAt);
  res.json(results.map(r => ({
    ...r,
    chapterBreakdown: JSON.parse(r.chapterBreakdown),
    createdAt: r.createdAt.toISOString(),
  })));
});

router.get("/results/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const userId = req.userId!;
  const [result] = await db.select().from(examResultsTable).where(and(eq(examResultsTable.id, id), eq(examResultsTable.userId, userId)));
  if (!result) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  res.json({
    ...result,
    chapterBreakdown: JSON.parse(result.chapterBreakdown),
    createdAt: result.createdAt.toISOString(),
  });
});

export default router;
