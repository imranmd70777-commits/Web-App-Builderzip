import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const examSessionsTable = pgTable("exam_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  status: text("status").notNull().default("active"),
  mcqIds: integer("mcq_ids").array().notNull(),
  chapterIds: integer("chapter_ids").array().notNull().default([]),
  subjectId: integer("subject_id"),
  timeLimitMinutes: integer("time_limit_minutes"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExamSessionSchema = createInsertSchema(examSessionsTable).omit({ id: true, createdAt: true });
export type InsertExamSession = z.infer<typeof insertExamSessionSchema>;
export type ExamSession = typeof examSessionsTable.$inferSelect;
