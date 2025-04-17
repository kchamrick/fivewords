import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { db } from "./db"; 
import { 
  users,
  createGameRequestSchema, 
  joinGameRequestSchema,
  updateRoundStatusSchema,
  submitPoemSchema,
  selectWinnerSchema,
  startNewRoundSchema
} from "@shared/schema";
import { generateRandomWords } from "../shared/wordGenerator";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // User routes
  apiRouter.post("/users", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }
      
      const user = await storage.createUser({ username, password });
      return res.status(201).json({
        id: user.id,
        username: user.username
      });
    } catch (error) {
      return res.status(500).json({ message: "Error creating user" });
    }
  });
  
  apiRouter.get("/users", async (req: Request, res: Response) => {
    try {
      // Need to add some users for testing if none exist
      const allUsers = await db.select().from(users);
      
      if (allUsers.length === 0) {
        // Add some test users if the database is empty
        await db.insert(users).values([
          { username: "John", password: "password" },
          { username: "Emma", password: "password" },
          { username: "Alex", password: "password" },
          { username: "Olivia", password: "password" },
          { username: "Daniel", password: "password" }
        ]);
        
        // Get the users again
        const newUsers = await db.select().from(users);
        return res.status(200).json(newUsers);
      }
      
      // Return the existing users
      return res.status(200).json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  // Game routes
  apiRouter.post("/games", async (req: Request, res: Response) => {
    try {
      const result = createGameRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid game data", errors: result.error.format() });
      }
      
      const { name, totalRounds, playerIds } = result.data;
      
      // First player (at index 0) is the host
      const hostId = playerIds[0];
      
      // Create game
      const game = await storage.createGame({
        name,
        createdBy: hostId,
        totalRounds,
      });
      
      // Add all players
      for (let i = 0; i < playerIds.length; i++) {
        const playerId = playerIds[i];
        const isHost = i === 0;
        
        await storage.addPlayerToGame({
          gameId: game.id,
          userId: playerId,
          isHost,
        });
      }
      
      // Create first round
      const round = await storage.createRound({
        gameId: game.id,
        roundNumber: 1,
        judgeId: hostId,
        words: generateRandomWords(5),
        timeLimit: 300, // 5 minutes default
      });
      
      // Create empty poems for all players except the judge
      for (const playerId of playerIds) {
        if (playerId !== hostId) {
          await storage.createPoem({
            roundId: round.id,
            playerId,
            content: ""
          });
        }
      }
      
      const gameWithDetails = await storage.getGameWithPlayers(game.id);
      return res.status(201).json(gameWithDetails);
    } catch (error) {
      console.error("Create game error:", error);
      return res.status(500).json({ message: "Error creating game" });
    }
  });
  
  apiRouter.get("/games/:id", async (req: Request, res: Response) => {
    try {
      const gameId = Number(req.params.id);
      
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      const game = await storage.getGameWithPlayers(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      return res.status(200).json(game);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching game" });
    }
  });
  
  // Round routes
  apiRouter.put("/rounds/:id/status", async (req: Request, res: Response) => {
    try {
      const roundId = Number(req.params.id);
      
      if (isNaN(roundId)) {
        return res.status(400).json({ message: "Invalid round ID" });
      }
      
      const result = z.object({ status: z.enum(["setup", "writing", "judging", "completed"]) }).safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const { status } = result.data;
      const round = await storage.getRound(roundId);
      
      if (!round) {
        return res.status(404).json({ message: "Round not found" });
      }
      
      // If transitioning to writing, set the end time
      if (status === "writing") {
        const endTime = new Date();
        endTime.setSeconds(endTime.getSeconds() + round.timeLimit);
        await storage.updateRoundEndTime(roundId, endTime);
      }
      
      const updatedRound = await storage.updateRoundStatus(roundId, status);
      const roundWithDetails = await storage.getRoundWithPoems(roundId);
      
      return res.status(200).json(roundWithDetails);
    } catch (error) {
      return res.status(500).json({ message: "Error updating round status" });
    }
  });
  
  // Poem routes
  apiRouter.put("/poems/:id", async (req: Request, res: Response) => {
    try {
      const poemId = Number(req.params.id);
      
      if (isNaN(poemId)) {
        return res.status(400).json({ message: "Invalid poem ID" });
      }
      
      const result = z.object({ content: z.string() }).safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid content" });
      }
      
      const { content } = result.data;
      const updatedPoem = await storage.updatePoem(poemId, content);
      
      if (!updatedPoem) {
        return res.status(404).json({ message: "Poem not found" });
      }
      
      return res.status(200).json(updatedPoem);
    } catch (error) {
      return res.status(500).json({ message: "Error updating poem" });
    }
  });
  
  apiRouter.post("/poems/:id/submit", async (req: Request, res: Response) => {
    try {
      const poemId = Number(req.params.id);
      
      if (isNaN(poemId)) {
        return res.status(400).json({ message: "Invalid poem ID" });
      }
      
      const poem = await storage.getPoem(poemId);
      
      if (!poem) {
        return res.status(404).json({ message: "Poem not found" });
      }
      
      if (!poem.content.trim()) {
        return res.status(400).json({ message: "Cannot submit empty poem" });
      }
      
      const updatedPoem = await storage.submitPoem(poemId);
      
      // Check if all poems for the round are submitted to auto-transition to judging phase
      const round = await storage.getRound(poem.roundId);
      if (round) {
        const poems = await storage.getPoemsByRound(round.id);
        const allSubmitted = poems.every(p => p.submitted);
        
        if (allSubmitted && round.status === "writing") {
          await storage.updateRoundStatus(round.id, "judging");
        }
      }
      
      return res.status(200).json(updatedPoem);
    } catch (error) {
      return res.status(500).json({ message: "Error submitting poem" });
    }
  });
  
  // Winner selection and next round
  apiRouter.post("/rounds/:id/winner", async (req: Request, res: Response) => {
    try {
      const roundId = Number(req.params.id);
      
      if (isNaN(roundId)) {
        return res.status(400).json({ message: "Invalid round ID" });
      }
      
      const result = z.object({ poemId: z.number() }).safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid poem ID" });
      }
      
      const { poemId } = result.data;
      
      const poem = await storage.getPoem(poemId);
      if (!poem) {
        return res.status(404).json({ message: "Poem not found" });
      }
      
      const winnerId = poem.playerId;
      const round = await storage.getRound(roundId);
      
      if (!round) {
        return res.status(404).json({ message: "Round not found" });
      }
      
      // Update the round with the winner
      await storage.setRoundWinner(roundId, winnerId);
      
      // Increment the winner's score
      await storage.updatePlayerScore(winnerId, 1);
      
      // Get the updated game with players (including updated scores)
      const game = await storage.getGameWithPlayers(round.gameId);
      
      return res.status(200).json(game);
    } catch (error) {
      return res.status(500).json({ message: "Error selecting winner" });
    }
  });
  
  apiRouter.post("/games/:id/next-round", async (req: Request, res: Response) => {
    try {
      const gameId = Number(req.params.id);
      
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (game.currentRound >= game.totalRounds) {
        // Game is over, mark as completed
        await storage.updateGame(gameId, { status: "completed" });
        return res.status(400).json({ message: "Game is already completed" });
      }
      
      // Get all players for this game to determine the next judge
      const players = await storage.getPlayersByGame(gameId);
      const playerCount = players.length;
      
      if (playerCount < 2) {
        return res.status(400).json({ message: "Not enough players" });
      }
      
      // Calculate next judge index (rotating through players)
      const nextJudgeIndex = (game.currentJudgeIndex + 1) % playerCount;
      const nextJudgeId = players[nextJudgeIndex].userId;
      
      // Update the game
      const nextRoundNumber = game.currentRound + 1;
      await storage.updateGame(gameId, {
        currentRound: nextRoundNumber,
        currentJudgeIndex: nextJudgeIndex,
      });
      
      // Create new round
      const newRound = await storage.createRound({
        gameId,
        roundNumber: nextRoundNumber,
        judgeId: nextJudgeId,
        words: generateRandomWords(5),
        timeLimit: 300,
      });
      
      // Create empty poems for all players except the judge
      for (const player of players) {
        if (player.userId !== nextJudgeId) {
          await storage.createPoem({
            roundId: newRound.id,
            playerId: player.id,
            content: ""
          });
        }
      }
      
      const updatedGame = await storage.getGameWithPlayers(gameId);
      return res.status(200).json(updatedGame);
    } catch (error) {
      return res.status(500).json({ message: "Error starting next round" });
    }
  });
  
  // Random words generation endpoint
  apiRouter.get("/random-words", (req: Request, res: Response) => {
    try {
      const count = Number(req.query.count) || 5;
      const words = generateRandomWords(count);
      return res.status(200).json({ words });
    } catch (error) {
      return res.status(500).json({ message: "Error generating random words" });
    }
  });
  
  // Use the router with /api prefix
  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
