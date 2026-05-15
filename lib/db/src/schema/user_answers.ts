import { pgTable, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { mcqsTable } from "./mcqs";

export const userAnswersTable = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  mcqId: integer("mcq_id").notNull().references(() => mcqsTable.id, { onDelete: "cascade" }),
  selectedOption: integer("selected_option").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  examSessionId: integer("exam_session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserAnswerSchema = createInsertSchema(userAnswersTable).omit({ id: true, createdAt: true });
export type InsertUserAnswer = z.infer<typeof insertUserAnswerSchema>;
export type UserAnswer = typeof userAnswersTable.$inferSelect;
