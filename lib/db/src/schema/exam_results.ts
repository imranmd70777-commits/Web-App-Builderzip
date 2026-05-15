import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { examSessionsTable } from "./exam_sessions";

export const examResultsTable = pgTable("exam_results", {
  id: serial("id").primaryKey(),
  examSessionId: integer("exam_session_id").notNull().references(() => examSessionsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  accuracy: real("accuracy").notNull(),
  timeTakenSeconds: integer("time_taken_seconds").notNull().default(0),
  answers: text("answers").notNull().default("[]"),
  chapterBreakdown: text("chapter_breakdown").notNull().default("[]"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExamResultSchema = createInsertSchema(examResultsTable).omit({ id: true, createdAt: true });
export type InsertExamResult = z.infer<typeof insertExamResultSchema>;
export type ExamResult = typeof examResultsTable.$inferSelect;
