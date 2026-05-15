import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { chaptersTable } from "./chapters";
import { subjectsTable } from "./subjects";

export const mcqsTable = pgTable("mcqs", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").notNull().references(() => chaptersTable.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: text("options").array().notNull(),
  correctOption: integer("correct_option").notNull(),
  explanation: text("explanation"),
  explanationImage: text("explanation_image"),
  difficulty: text("difficulty").notNull().default("medium"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMcqSchema = createInsertSchema(mcqsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMcq = z.infer<typeof insertMcqSchema>;
export type Mcq = typeof mcqsTable.$inferSelect;
