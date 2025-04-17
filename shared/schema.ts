import { pgTable, text, serial, integer, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Game model
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdBy: integer("created_by").notNull(),
  currentRound: integer("current_round").default(1).notNull(),
  totalRounds: integer("total_rounds").default(5).notNull(),
  currentJudgeIndex: integer("current_judge_index").default(0).notNull(),
  status: text("status").default("waiting").notNull(), // waiting, active, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
  currentRound: true,
  currentJudgeIndex: true,
  status: true
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

// Player model (users in a specific game)
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  userId: integer("user_id").notNull(),
  score: integer("score").default(0).notNull(),
  isHost: boolean("is_host").default(false).notNull(),
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  score: true,
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

// Round model
export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  roundNumber: integer("round_number").notNull(),
  judgeId: integer("judge_id").notNull(), // The player who is judging this round
  words: text("words").array().notNull(), // The 5 words for the round
  status: text("status").default("setup").notNull(), // setup, writing, judging, completed
  timeLimit: integer("time_limit").default(300).notNull(), // time limit in seconds
  endTime: timestamp("end_time"), // when the writing period ends
  winnerId: integer("winner_id"), // The player who won this round
});

export const insertRoundSchema = createInsertSchema(rounds).omit({
  id: true,
  status: true,
  winnerId: true,
  endTime: true,
});

export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Round = typeof rounds.$inferSelect;

// Poem model
export const poems = pgTable("poems", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").notNull(),
  playerId: integer("player_id").notNull(),
  content: text("content").notNull(),
  submitted: boolean("submitted").default(false).notNull(),
  submittedAt: timestamp("submitted_at"),
});

export const insertPoemSchema = createInsertSchema(poems).omit({
  id: true,
  submitted: true,
  submittedAt: true,
});

export type InsertPoem = z.infer<typeof insertPoemSchema>;
export type Poem = typeof poems.$inferSelect;

// Extended types for frontend use
export interface GameWithPlayers extends Game {
  players: (Player & { user: User })[];
  currentRound?: RoundWithPoems;
}

export interface RoundWithPoems extends Round {
  poems: Poem[];
  judge: User;
}

export interface PoemWithAuthor extends Poem {
  author: User;
}

// Schemas for API requests
export const createGameRequestSchema = z.object({
  name: z.string().min(1).max(100),
  totalRounds: z.number().int().min(1).max(10),
  playerIds: z.array(z.number().int()).min(2).max(5),
});

export const joinGameRequestSchema = z.object({
  gameId: z.number().int(),
  userId: z.number().int(),
});

export const updateRoundStatusSchema = z.object({
  gameId: z.number().int(),
  roundId: z.number().int(),
  status: z.enum(["setup", "writing", "judging", "completed"]),
});

export const submitPoemSchema = z.object({
  roundId: z.number().int(),
  playerId: z.number().int(),
  content: z.string().min(1),
});

export const selectWinnerSchema = z.object({
  roundId: z.number().int(),
  poemId: z.number().int(),
});

export const startNewRoundSchema = z.object({
  gameId: z.number().int(),
});
