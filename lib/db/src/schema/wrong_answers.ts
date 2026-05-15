import { pgTable, serial, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { mcqsTable } from "./mcqs";

export const wrongAnswersTable = pgTable("wrong_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  mcqId: integer("mcq_id").notNull().references(() => mcqsTable.id, { onDelete: "cascade" }),
  selectedOption: integer("selected_option").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [unique().on(t.userId, t.mcqId)]);

export const insertWrongAnswerSchema = createInsertSchema(wrongAnswersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWrongAnswer = z.infer<typeof insertWrongAnswerSchema>;
export type WrongAnswer = typeof wrongAnswersTable.$inferSelect;
